-- Unified Provider Location Team Architecture Migration
-- Establishes single source of truth for all Provider → Location → Team relationships
-- Date: 2025-06-20

-- =============================================================================
-- PHASE 1: BACKUP AND ANALYZE CURRENT STATE
-- =============================================================================

-- Create backup tables for rollback capability
CREATE TABLE IF NOT EXISTS backup_authorized_providers AS 
SELECT * FROM authorized_providers;

CREATE TABLE IF NOT EXISTS backup_ap_user_location_assignments AS 
SELECT * FROM ap_user_location_assignments;

CREATE TABLE IF NOT EXISTS backup_teams AS 
SELECT * FROM teams;

-- =============================================================================
-- PRELIMINARY: CLEAN UP EXISTING TRIGGERS TO PREVENT INTERFERENCE
-- =============================================================================

-- Drop any existing triggers that might interfere with the migration
DROP TRIGGER IF EXISTS trigger_sync_authorized_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS trigger_auto_assign_team_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS sync_authorized_providers_trigger ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS auto_assign_providers_trigger ON ap_user_location_assignments;

RAISE NOTICE 'Cleaned up existing triggers before migration';

-- =============================================================================
-- PHASE 2: ENHANCE AP USER LOCATION ASSIGNMENTS (MASTER TABLE)
-- =============================================================================

-- Make ap_user_location_assignments the single source of truth
ALTER TABLE ap_user_location_assignments 
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS assignment_priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS auto_assign_teams BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Clean up any existing duplicates first
UPDATE ap_user_location_assignments
SET is_primary = false;

-- Set primary assignment for each user (first active assignment)
UPDATE ap_user_location_assignments
SET is_primary = true
WHERE id IN (
    SELECT DISTINCT ON (ap_user_id) id
    FROM ap_user_location_assignments
    WHERE status = 'active'
    ORDER BY ap_user_id, created_at
);

-- Create unique constraint for primary assignments
CREATE UNIQUE INDEX IF NOT EXISTS unique_primary_per_user
ON ap_user_location_assignments(ap_user_id)
WHERE is_primary = true;

-- First, check if authorized_providers table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'authorized_providers') THEN
        RAISE EXCEPTION 'Table authorized_providers does not exist';
    END IF;
    RAISE NOTICE 'authorized_providers table exists';
END $$;

-- Drop existing constraint if it exists (to start fresh)
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        )
    LOOP
        EXECUTE format('ALTER TABLE authorized_providers DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped existing constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Clean up duplicates more aggressively
DO $$
DECLARE
    duplicate_count INTEGER;
    cleanup_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT user_id
        FROM authorized_providers
        WHERE user_id IS NOT NULL
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) dups;
    
    RAISE NOTICE 'Found % users with duplicate records', duplicate_count;
    
    IF duplicate_count > 0 THEN
        -- Log the duplicates
        RAISE NOTICE 'Duplicate user_ids: %', (
            SELECT string_agg(user_id::text, ', ')
            FROM (
                SELECT user_id
                FROM authorized_providers
                WHERE user_id IS NOT NULL
                GROUP BY user_id
                HAVING COUNT(*) > 1
                LIMIT 10
            ) dups
        );
        
        -- Delete duplicates, keeping the one with the most recent update
        WITH ranked_providers AS (
            SELECT id, user_id,
                   ROW_NUMBER() OVER (
                       PARTITION BY user_id
                       ORDER BY updated_at DESC NULLS LAST,
                                created_at DESC NULLS LAST,
                                id DESC
                   ) as rn
            FROM authorized_providers
            WHERE user_id IS NOT NULL
        )
        DELETE FROM authorized_providers
        WHERE id IN (
            SELECT id FROM ranked_providers WHERE rn > 1
        );
        
        GET DIAGNOSTICS cleanup_count = ROW_COUNT;
        RAISE NOTICE 'Removed % duplicate records', cleanup_count;
    END IF;
END $$;

-- Create the unique constraint with explicit error handling
DO $$
BEGIN
    BEGIN
        ALTER TABLE authorized_providers ADD CONSTRAINT authorized_providers_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Successfully created unique constraint on authorized_providers.user_id';
    EXCEPTION
        WHEN unique_violation THEN
            RAISE EXCEPTION 'Still have duplicate user_id values after cleanup. Manual intervention required.';
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Failed to create unique constraint: %', SQLERRM;
    END;
END $$;

-- Verify the constraint was created
DO $$
DECLARE
    constraint_exists BOOLEAN;
    constraint_name TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        )
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        SELECT c.conname INTO constraint_name
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        );
        RAISE NOTICE 'VERIFIED: Unique constraint exists with name: %', constraint_name;
    ELSE
        RAISE EXCEPTION 'FAILED: Unique constraint was not created successfully';
    END IF;
END $$;

-- =============================================================================
-- PHASE 3: CREATE UNIFIED FUNCTIONS
-- =============================================================================

-- Function to sync authorized_providers from ap_user_location_assignments
CREATE OR REPLACE FUNCTION sync_authorized_providers()
RETURNS TRIGGER AS $$
DECLARE
    user_profile RECORD;
    primary_assignment RECORD;
    constraint_exists BOOLEAN;
BEGIN
    -- Validate that user_id constraint exists
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        )
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Required unique constraint on authorized_providers.user_id is missing';
    END IF;

    -- Get the AP user's profile
    SELECT * INTO user_profile
    FROM profiles
    WHERE id = COALESCE(NEW.ap_user_id, OLD.ap_user_id);
    
    IF NOT FOUND OR user_profile.role != 'AP' THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Get the user's primary assignment
    SELECT * INTO primary_assignment
    FROM ap_user_location_assignments
    WHERE ap_user_id = user_profile.id
    AND is_primary = true
    AND status = 'active';
    
    IF FOUND THEN
        BEGIN
            -- Create or update authorized_providers record
            INSERT INTO authorized_providers (
                user_id,
                name,
                provider_type,
                status,
                primary_location_id,
                contact_email,
                description,
                performance_rating,
                compliance_score,
                created_at,
                updated_at
            ) VALUES (
                user_profile.id,
                COALESCE(user_profile.display_name, 'Provider ' || user_profile.email),
                'authorized_partner',
                'APPROVED',
                primary_assignment.location_id,
                user_profile.email,
                'Auto-synced from location assignment',
                0,
                0,
                NOW(),
                NOW()
            )
            ON CONFLICT ON CONSTRAINT authorized_providers_user_id_unique
            DO UPDATE SET
                primary_location_id = EXCLUDED.primary_location_id,
                name = EXCLUDED.name,
                contact_email = EXCLUDED.contact_email,
                status = EXCLUDED.status,
                updated_at = NOW();
            
            RAISE NOTICE 'Synced authorized_provider for user %', user_profile.id;
        EXCEPTION
            WHEN unique_violation THEN
                -- Handle any unique constraint violations gracefully
                RAISE WARNING 'Unique constraint violation when syncing provider for user %', user_profile.id;
                -- Try to update existing record instead
                UPDATE authorized_providers
                SET primary_location_id = primary_assignment.location_id,
                    name = COALESCE(user_profile.display_name, 'Provider ' || user_profile.email),
                    contact_email = user_profile.email,
                    status = 'APPROVED',
                    updated_at = NOW()
                WHERE user_id = user_profile.id;
        END;
    ELSE
        -- No primary assignment, deactivate provider record
        UPDATE authorized_providers
        SET status = 'INACTIVE', updated_at = NOW()
        WHERE user_id = user_profile.id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-assign teams to providers when location assignments change
CREATE OR REPLACE FUNCTION auto_assign_team_providers()
RETURNS TRIGGER AS $$
DECLARE
    location_provider RECORD;
BEGIN
    -- Find the primary AP user for this location
    SELECT ap.id as provider_id INTO location_provider
    FROM authorized_providers ap
    JOIN ap_user_location_assignments ala ON ap.user_id = ala.ap_user_id
    WHERE ala.location_id = NEW.location_id 
    AND ala.is_primary = true 
    AND ala.status = 'active'
    AND ap.status = 'APPROVED';
    
    IF FOUND THEN
        -- Auto-assign provider to teams at this location
        UPDATE teams 
        SET provider_id = location_provider.provider_id,
            updated_at = NOW()
        WHERE location_id = NEW.location_id 
        AND (provider_id IS NULL OR provider_id != location_provider.provider_id);
        
        RAISE NOTICE 'Auto-assigned provider % to teams at location %', 
            location_provider.provider_id, NEW.location_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for unified AP user assignment
CREATE OR REPLACE FUNCTION assign_ap_user_unified(
    p_ap_user_id UUID,
    p_location_id UUID,
    p_is_primary BOOLEAN DEFAULT false,
    p_assignment_role VARCHAR(50) DEFAULT 'provider'
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
    existing_primary RECORD;
BEGIN
    -- Validate AP user
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_ap_user_id AND role = 'AP' AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'User is not an active AP user';
    END IF;
    
    -- Validate location
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location not found';
    END IF;
    
    -- Handle primary assignment logic
    IF p_is_primary THEN
        -- Remove existing primary assignment for this user
        UPDATE ap_user_location_assignments 
        SET is_primary = false, updated_at = NOW()
        WHERE ap_user_id = p_ap_user_id AND is_primary = true;
    END IF;
    
    -- Create or update assignment
    INSERT INTO ap_user_location_assignments (
        ap_user_id,
        location_id,
        assignment_role,
        status,
        is_primary,
        assigned_by,
        assigned_at
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        p_assignment_role,
        'active',
        p_is_primary,
        auth.uid(),
        NOW()
    )
    ON CONFLICT (ap_user_id, location_id)
    DO UPDATE SET
        assignment_role = EXCLUDED.assignment_role,
        status = 'active',
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW()
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- PHASE 4: CREATE TRIGGERS
-- =============================================================================

-- Final constraint verification before creating triggers
DO $$
DECLARE
    constraint_exists BOOLEAN;
    constraint_name TEXT;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        )
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'CRITICAL: Cannot create triggers - unique constraint on authorized_providers.user_id is still missing after Phase 2';
    END IF;
    
    SELECT c.conname INTO constraint_name
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'authorized_providers'
    AND c.contype = 'u'
    AND array_length(c.conkey, 1) = 1
    AND c.conkey[1] = (
        SELECT attnum FROM pg_attribute
        WHERE attrelid = t.oid AND attname = 'user_id'
    );
    
    RAISE NOTICE 'Constraint verified before trigger creation: %', constraint_name;
END $$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_sync_authorized_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS trigger_auto_assign_team_providers ON ap_user_location_assignments;

-- Create triggers for automatic synchronization
CREATE TRIGGER trigger_sync_authorized_providers
    AFTER INSERT OR UPDATE OR DELETE ON ap_user_location_assignments
    FOR EACH ROW EXECUTE FUNCTION sync_authorized_providers();

CREATE TRIGGER trigger_auto_assign_team_providers
    AFTER INSERT OR UPDATE ON ap_user_location_assignments
    FOR EACH ROW
    WHEN (NEW.is_primary = true AND NEW.status = 'active')
    EXECUTE FUNCTION auto_assign_team_providers();

RAISE NOTICE 'Triggers created successfully';

-- =============================================================================
-- PHASE 5: DATA MIGRATION AND CLEANUP
-- =============================================================================

-- Validate constraint exists before proceeding
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
        AND array_length(c.conkey, 1) = 1
        AND c.conkey[1] = (
            SELECT attnum FROM pg_attribute
            WHERE attrelid = t.oid AND attname = 'user_id'
        )
    ) INTO constraint_exists;
    
    IF NOT constraint_exists THEN
        RAISE EXCEPTION 'Cannot proceed with migration: unique constraint on authorized_providers.user_id is missing';
    END IF;
    
    RAISE NOTICE 'Constraint validation passed - proceeding with data migration';
END $$;

-- Migrate existing authorized_providers to ap_user_location_assignments
DO $$
DECLARE
    provider_record RECORD;
    assignment_exists BOOLEAN;
    migration_count INTEGER := 0;
BEGIN
    FOR provider_record IN
        SELECT * FROM authorized_providers
        WHERE user_id IS NOT NULL AND primary_location_id IS NOT NULL
    LOOP
        -- Check if assignment already exists
        SELECT EXISTS(
            SELECT 1 FROM ap_user_location_assignments
            WHERE ap_user_id = provider_record.user_id
            AND location_id = provider_record.primary_location_id
        ) INTO assignment_exists;
        
        IF NOT assignment_exists THEN
            -- Create the assignment
            INSERT INTO ap_user_location_assignments (
                ap_user_id,
                location_id,
                assignment_role,
                status,
                is_primary,
                assigned_at
            ) VALUES (
                provider_record.user_id,
                provider_record.primary_location_id,
                'provider',
                CASE
                    WHEN provider_record.status = 'APPROVED' THEN 'active'
                    ELSE 'inactive'
                END,
                true, -- Assume existing providers are primary
                COALESCE(provider_record.created_at, NOW())
            );
            
            migration_count := migration_count + 1;
            RAISE NOTICE 'Migrated provider % to location assignment', provider_record.user_id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migration completed: % providers migrated to location assignments', migration_count;
END $$;

-- Fix teams without proper provider assignments
UPDATE teams 
SET provider_id = (
    SELECT ap.id 
    FROM authorized_providers ap
    JOIN ap_user_location_assignments ala ON ap.user_id = ala.ap_user_id
    WHERE ala.location_id = teams.location_id 
    AND ala.is_primary = true 
    AND ala.status = 'active'
    AND ap.status = 'APPROVED'
    LIMIT 1
)
WHERE provider_id IS NULL 
AND location_id IS NOT NULL;

-- =============================================================================
-- PHASE 6: CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_primary 
ON ap_user_location_assignments(ap_user_id) WHERE is_primary = true;

CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_location_active 
ON ap_user_location_assignments(location_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_teams_location_provider 
ON teams(location_id, provider_id);

-- =============================================================================
-- PHASE 7: UPDATE RLS POLICIES
-- =============================================================================

-- Enable RLS on ap_user_location_assignments if not already enabled
ALTER TABLE ap_user_location_assignments ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for the enhanced schema
DROP POLICY IF EXISTS "admin_full_ap_assignments_access" ON ap_user_location_assignments;
DROP POLICY IF EXISTS "ap_users_view_own_assignments" ON ap_user_location_assignments;

CREATE POLICY "admin_full_ap_assignments_access" ON ap_user_location_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "ap_users_view_own_assignments" ON ap_user_location_assignments
FOR SELECT USING (
    ap_user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD', 'AP')
    )
);

-- =============================================================================
-- PHASE 8: GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON ap_user_location_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_unified TO authenticated;
GRANT EXECUTE ON FUNCTION sync_authorized_providers TO postgres, service_role;
GRANT EXECUTE ON FUNCTION auto_assign_team_providers TO postgres, service_role;

-- =============================================================================
-- COMPLETION AND VALIDATION
-- =============================================================================

-- Create a view for unified assignment status
CREATE OR REPLACE VIEW unified_provider_assignments AS
SELECT 
    p.id as ap_user_id,
    p.display_name,
    p.email,
    ala.location_id,
    l.name as location_name,
    ala.is_primary,
    ala.assignment_role,
    ala.status as assignment_status,
    ap.id as provider_id,
    ap.status as provider_status,
    COUNT(t.id) as managed_teams_count
FROM profiles p
LEFT JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id
LEFT JOIN locations l ON ala.location_id = l.id
LEFT JOIN authorized_providers ap ON p.id = ap.user_id
LEFT JOIN teams t ON ap.id = t.provider_id
WHERE p.role = 'AP'
GROUP BY p.id, p.display_name, p.email, ala.location_id, l.name, 
         ala.is_primary, ala.assignment_role, ala.status, ap.id, ap.status;

-- Grant access to the view
GRANT SELECT ON unified_provider_assignments TO authenticated;

-- Final validation
DO $$
DECLARE
    assignment_count INTEGER;
    provider_count INTEGER;
    team_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO assignment_count FROM ap_user_location_assignments;
    SELECT COUNT(*) INTO provider_count FROM authorized_providers WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO team_count FROM teams WHERE provider_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'AP User Location Assignments: %', assignment_count;
    RAISE NOTICE 'Authorized Providers: %', provider_count;
    RAISE NOTICE 'Teams with Providers: %', team_count;
END $$;

-- Log completion
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
    'unified_provider_location_architecture', 
    NOW(), 
    'Established single source of truth for Provider → Location → Team relationships'
) ON CONFLICT DO NOTHING;

RAISE NOTICE 'Unified Provider Location Architecture migration completed successfully!';
RAISE NOTICE 'Key Features:';
RAISE NOTICE '- ap_user_location_assignments is now the master table';  
RAISE NOTICE '- authorized_providers auto-syncs from assignments';
RAISE NOTICE '- Teams auto-assign providers based on location';
RAISE NOTICE '- Triggers maintain data consistency';
RAISE NOTICE '- unified_provider_assignments view provides complete status';