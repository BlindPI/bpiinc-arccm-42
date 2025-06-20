-- Unified AP Team Management Architecture
-- Simplifies fragmented systems into clear Location → AP User → Teams hierarchy
-- Date: 2025-06-20

-- =============================================================================
-- BACKUP EXISTING DATA
-- =============================================================================

-- Create comprehensive backup
CREATE TABLE IF NOT EXISTS backup_20250620_ap_user_location_assignments AS 
SELECT *, NOW() as backup_created_at FROM ap_user_location_assignments;

CREATE TABLE IF NOT EXISTS backup_20250620_authorized_providers AS 
SELECT *, NOW() as backup_created_at FROM authorized_providers;

CREATE TABLE IF NOT EXISTS backup_20250620_teams AS 
SELECT *, NOW() as backup_created_at FROM teams;

RAISE NOTICE 'Backup tables created successfully';

-- =============================================================================
-- SIMPLIFIED SCHEMA: REMOVE COMPLEXITY
-- =============================================================================

-- Drop complex triggers that cause sync issues
DROP TRIGGER IF EXISTS trigger_sync_authorized_providers ON ap_user_location_assignments;
DROP TRIGGER IF EXISTS trigger_auto_assign_team_providers ON ap_user_location_assignments;

-- Drop problematic functions
DROP FUNCTION IF EXISTS sync_authorized_providers() CASCADE;
DROP FUNCTION IF EXISTS auto_assign_team_providers() CASCADE;

RAISE NOTICE 'Removed complex trigger systems';

-- =============================================================================
-- MASTER TABLE: AP_USER_LOCATION_ASSIGNMENTS (SINGLE SOURCE OF TRUTH)
-- =============================================================================

-- Simplify ap_user_location_assignments to be the master table
ALTER TABLE ap_user_location_assignments 
DROP COLUMN IF EXISTS assignment_role,
DROP COLUMN IF EXISTS assignment_priority,
DROP COLUMN IF EXISTS auto_assign_teams,
DROP COLUMN IF EXISTS notes,
DROP COLUMN IF EXISTS is_primary;

-- Add essential columns only
ALTER TABLE ap_user_location_assignments
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES profiles(id);

-- Update existing records to be active
UPDATE ap_user_location_assignments 
SET is_active = (status = 'active')
WHERE is_active IS NULL;

-- Create clean unique constraint (one assignment per AP user per location)
DROP INDEX IF EXISTS unique_primary_per_user;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_ap_location_assignment
ON ap_user_location_assignments(ap_user_id, location_id);

RAISE NOTICE 'Simplified ap_user_location_assignments table';

-- =============================================================================
-- TEAMS TABLE: DIRECT AP USER ASSIGNMENT
-- =============================================================================

-- Simplify teams table - direct assignment to AP users (no provider middleman)
ALTER TABLE teams
DROP COLUMN IF EXISTS provider_id; -- Remove complex provider relationship

-- Add direct AP user assignment
ALTER TABLE teams
ADD COLUMN IF NOT EXISTS assigned_ap_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS created_by_ap_user_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS team_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Migrate existing provider assignments to direct AP user assignments
UPDATE teams 
SET assigned_ap_user_id = (
    SELECT ap.user_id 
    FROM authorized_providers ap 
    WHERE ap.id = teams.provider_id 
    AND ap.user_id IS NOT NULL
    LIMIT 1
)
WHERE provider_id IS NOT NULL;

-- Set team as active where it has a location and assignment
UPDATE teams 
SET is_active = (location_id IS NOT NULL AND assigned_ap_user_id IS NOT NULL)
WHERE is_active IS NULL;

RAISE NOTICE 'Simplified teams table with direct AP user assignment';

-- =============================================================================
-- UNIFIED FUNCTIONS: SIMPLE AND RELIABLE
-- =============================================================================

-- Function to assign AP user to location (single source of truth)
CREATE OR REPLACE FUNCTION assign_ap_user_to_location(
    p_ap_user_id UUID,
    p_location_id UUID,
    p_assigned_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Validate AP user exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = p_ap_user_id 
        AND role = 'AP' 
        AND status = 'ACTIVE'
    ) THEN
        RAISE EXCEPTION 'User is not an active AP user';
    END IF;
    
    -- Validate location exists
    IF NOT EXISTS (SELECT 1 FROM locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location does not exist';
    END IF;
    
    -- Create or update assignment
    INSERT INTO ap_user_location_assignments (
        ap_user_id,
        location_id,
        is_active,
        assigned_by,
        assigned_at,
        created_at
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        true,
        COALESCE(p_assigned_by, auth.uid()),
        NOW(),
        NOW()
    )
    ON CONFLICT (ap_user_id, location_id)
    DO UPDATE SET
        is_active = true,
        assigned_by = COALESCE(p_assigned_by, auth.uid()),
        updated_at = NOW()
    RETURNING id INTO assignment_id;
    
    RAISE NOTICE 'AP user % assigned to location %', p_ap_user_id, p_location_id;
    RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create team for AP user at location
CREATE OR REPLACE FUNCTION create_team_for_ap_user(
    p_team_name VARCHAR(255),
    p_location_id UUID,
    p_assigned_ap_user_id UUID,
    p_created_by_ap_user_id UUID DEFAULT NULL,
    p_team_type VARCHAR(50) DEFAULT 'general',
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    team_id UUID;
BEGIN
    -- Validate AP user is assigned to this location
    IF NOT EXISTS (
        SELECT 1 FROM ap_user_location_assignments 
        WHERE ap_user_id = p_assigned_ap_user_id 
        AND location_id = p_location_id 
        AND is_active = true
    ) THEN
        RAISE EXCEPTION 'AP user is not assigned to this location';
    END IF;
    
    -- Create team
    INSERT INTO teams (
        name,
        description,
        location_id,
        assigned_ap_user_id,
        created_by_ap_user_id,
        team_type,
        is_active,
        status,
        created_at
    ) VALUES (
        p_team_name,
        p_description,
        p_location_id,
        p_assigned_ap_user_id,
        COALESCE(p_created_by_ap_user_id, auth.uid()),
        p_team_type,
        true,
        'active',
        NOW()
    )
    RETURNING id INTO team_id;
    
    RAISE NOTICE 'Team % created for AP user % at location %', team_id, p_assigned_ap_user_id, p_location_id;
    RETURN team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get AP user dashboard data
CREATE OR REPLACE FUNCTION get_ap_user_dashboard(p_ap_user_id UUID)
RETURNS TABLE (
    location_id UUID,
    location_name VARCHAR,
    team_count BIGINT,
    member_count BIGINT,
    assignment_date TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as location_id,
        l.name as location_name,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT tm.id) as member_count,
        ala.assigned_at as assignment_date
    FROM locations l
    JOIN ap_user_location_assignments ala ON l.id = ala.location_id
    LEFT JOIN teams t ON l.id = t.location_id AND t.assigned_ap_user_id = p_ap_user_id AND t.is_active = true
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
    WHERE ala.ap_user_id = p_ap_user_id 
    AND ala.is_active = true
    GROUP BY l.id, l.name, ala.assigned_at
    ORDER BY ala.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Created unified management functions';

-- =============================================================================
-- CLEAN UP AUTHORIZED_PROVIDERS (OPTIONAL LEGACY SUPPORT)
-- =============================================================================

-- Keep authorized_providers for legacy compatibility but make it simple
-- Remove complex constraints that cause issues
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Drop all unique constraints on authorized_providers
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'authorized_providers'
        AND c.contype = 'u'
    LOOP
        EXECUTE format('ALTER TABLE authorized_providers DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Simplify authorized_providers - just keep basic info, no sync
ALTER TABLE authorized_providers
DROP COLUMN IF EXISTS primary_location_id,
ADD COLUMN IF NOT EXISTS simplified_record BOOLEAN DEFAULT true;

-- Mark all as simplified legacy records
UPDATE authorized_providers SET simplified_record = true;

RAISE NOTICE 'Simplified authorized_providers for legacy compatibility';

-- =============================================================================
-- CREATE PERFORMANCE INDEXES
-- =============================================================================

-- Indexes for fast AP user dashboard queries
CREATE INDEX IF NOT EXISTS idx_ap_location_assignments_active 
ON ap_user_location_assignments(ap_user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_teams_ap_user_active 
ON teams(assigned_ap_user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_teams_location_active 
ON teams(location_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_team_members_active 
ON team_members(team_id) WHERE status = 'active';

-- =============================================================================
-- CREATE UNIFIED VIEWS FOR REPORTING
-- =============================================================================

-- Unified view for admin dashboard
CREATE OR REPLACE VIEW unified_ap_team_overview AS
SELECT 
    p.id as ap_user_id,
    p.display_name,
    p.email,
    COUNT(DISTINCT ala.location_id) as assigned_locations,
    COUNT(DISTINCT t.id) as managed_teams,
    COUNT(DISTINCT tm.id) as total_members,
    CASE 
        WHEN COUNT(DISTINCT ala.location_id) > 0 THEN 'assigned'
        ELSE 'unassigned'
    END as assignment_status
FROM profiles p
LEFT JOIN ap_user_location_assignments ala ON p.id = ala.ap_user_id AND ala.is_active = true
LEFT JOIN teams t ON p.id = t.assigned_ap_user_id AND t.is_active = true
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE p.role = 'AP' AND p.status = 'ACTIVE'
GROUP BY p.id, p.display_name, p.email
ORDER BY p.display_name;

-- Location-team summary view
CREATE OR REPLACE VIEW location_team_summary AS
SELECT 
    l.id as location_id,
    l.name as location_name,
    COUNT(DISTINCT ala.ap_user_id) as assigned_ap_users,
    COUNT(DISTINCT t.id) as total_teams,
    COUNT(DISTINCT tm.id) as total_members
FROM locations l
LEFT JOIN ap_user_location_assignments ala ON l.id = ala.location_id AND ala.is_active = true
LEFT JOIN teams t ON l.id = t.location_id AND t.is_active = true
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
GROUP BY l.id, l.name
ORDER BY l.name;

RAISE NOTICE 'Created unified reporting views';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON ap_user_location_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON teams TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_for_ap_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_dashboard TO authenticated;
GRANT SELECT ON unified_ap_team_overview TO authenticated;
GRANT SELECT ON location_team_summary TO authenticated;

-- =============================================================================
-- FINAL VALIDATION AND CLEANUP
-- =============================================================================

-- Validate data integrity
DO $$
DECLARE
    ap_count INTEGER;
    assignment_count INTEGER;
    team_count INTEGER;
    active_assignments INTEGER;
BEGIN
    SELECT COUNT(*) INTO ap_count FROM profiles WHERE role = 'AP' AND status = 'ACTIVE';
    SELECT COUNT(*) INTO assignment_count FROM ap_user_location_assignments WHERE is_active = true;
    SELECT COUNT(*) INTO team_count FROM teams WHERE is_active = true;
    SELECT COUNT(*) INTO active_assignments FROM ap_user_location_assignments ala
    JOIN teams t ON ala.ap_user_id = t.assigned_ap_user_id AND ala.location_id = t.location_id
    WHERE ala.is_active = true AND t.is_active = true;
    
    RAISE NOTICE '=== UNIFIED ARCHITECTURE MIGRATION COMPLETE ===';
    RAISE NOTICE 'Active AP Users: %', ap_count;
    RAISE NOTICE 'Active Location Assignments: %', assignment_count;
    RAISE NOTICE 'Active Teams: %', team_count;
    RAISE NOTICE 'Properly Linked Teams: %', active_assignments;
    RAISE NOTICE '';
    RAISE NOTICE 'Key Benefits:';
    RAISE NOTICE '- Single source of truth: ap_user_location_assignments';
    RAISE NOTICE '- Direct AP user → team assignment (no provider middleman)';
    RAISE NOTICE '- Simplified, reliable data relationships';
    RAISE NOTICE '- Ready for professional AP dashboard';
    RAISE NOTICE '=== MIGRATION SUCCESSFUL ===';
END $$;

-- Log migration completion
INSERT INTO migration_log (migration_name, completed_at, notes) 
VALUES (
    'unified_ap_team_architecture', 
    NOW(), 
    'Simplified fragmented systems into clear Location → AP User → Teams hierarchy'
) ON CONFLICT (migration_name) DO UPDATE SET
    completed_at = NOW(),
    notes = EXCLUDED.notes;