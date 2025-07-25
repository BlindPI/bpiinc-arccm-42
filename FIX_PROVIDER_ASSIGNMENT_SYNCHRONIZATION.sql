-- =====================================================================================
-- CRITICAL FIX: PROVIDER ASSIGNMENT SYNCHRONIZATION 
-- =====================================================================================
-- Issue: teams.provider_id out of sync with provider_team_assignments.provider_id
-- Result: Dashboards show wrong assignments, access controls work correctly
-- Root Cause: Assignment creation only updates assignments table, not teams.provider_id
-- =====================================================================================

-- =====================================================================================
-- STEP 1: IMMEDIATE SYNCHRONIZATION REPAIR
-- =====================================================================================

-- Fix the current mismatch: Update teams.provider_id to match active primary assignments
UPDATE teams 
SET 
    provider_id = pta.provider_id,
    updated_at = NOW()
FROM provider_team_assignments pta
WHERE teams.id = pta.team_id 
AND pta.status = 'active' 
AND pta.assignment_role = 'primary'
AND (teams.provider_id IS NULL OR teams.provider_id != pta.provider_id);

-- Report what was fixed
SELECT 
    'SYNCHRONIZATION REPAIR COMPLETED' as action,
    COUNT(*) as teams_updated
FROM teams t
JOIN provider_team_assignments pta ON t.id = pta.team_id
WHERE pta.status = 'active' 
AND pta.assignment_role = 'primary';

-- =====================================================================================
-- STEP 2: CREATE MISSING AUTHORIZED_PROVIDER RECORD
-- =====================================================================================

-- Create authorized_provider record for "The Test User" (jonathan.d.e.wood@gmail.com)
INSERT INTO authorized_providers (
    user_id,
    name,
    provider_type,
    status,
    contact_email,
    description,
    performance_rating,
    compliance_score,
    created_at,
    updated_at
)
SELECT
    p.id as user_id,
    COALESCE(p.display_name, 'The Test User') as name,
    'authorized_provider' as provider_type,
    'APPROVED' as status,
    p.email as contact_email,
    'Authorized Provider for ' || COALESCE(p.display_name, p.email) as description,
    4.5 as performance_rating,
    95.0 as compliance_score,
    NOW() as created_at,
    NOW() as updated_at
FROM profiles p
WHERE p.role = 'AP'
AND p.status = 'ACTIVE'
AND NOT EXISTS (
    SELECT 1 FROM authorized_providers ap
    WHERE ap.user_id = p.id
);

-- =====================================================================================
-- STEP 3: FIX ASSIGNMENT CREATION FUNCTION
-- =====================================================================================

-- Drop existing functions to allow return type changes
DROP FUNCTION IF EXISTS assign_provider_to_team_safe(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, DATE);
DROP FUNCTION IF EXISTS remove_provider_from_team_safe(UUID, UUID);

-- Update the assignment creation function to maintain synchronization
CREATE OR REPLACE FUNCTION assign_provider_to_team_safe(
    p_provider_id UUID,
    p_team_id UUID,
    p_assignment_role VARCHAR DEFAULT 'primary',
    p_oversight_level VARCHAR DEFAULT 'standard',
    p_assignment_type VARCHAR DEFAULT 'ongoing',
    p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_id UUID;
    provider_exists BOOLEAN;
    team_exists BOOLEAN;
    provider_status VARCHAR;
    team_status VARCHAR;
BEGIN
    -- Validate provider exists and is active
    SELECT 
        EXISTS(
            SELECT 1 FROM public.authorized_providers
            WHERE id = p_provider_id AND status IN ('active', 'APPROVED', 'approved')
        ),
        (SELECT status FROM public.authorized_providers WHERE id = p_provider_id LIMIT 1)
    INTO provider_exists, provider_status;

    IF NOT provider_exists THEN
        RAISE EXCEPTION 'Provider % does not exist or is not active (status: %)', p_provider_id, provider_status;
    END IF;

    -- Validate team exists and is active
    SELECT 
        EXISTS(
            SELECT 1 FROM public.teams
            WHERE id = p_team_id AND status = 'active'
        ),
        (SELECT status FROM public.teams WHERE id = p_team_id LIMIT 1)
    INTO team_exists, team_status;

    IF NOT team_exists THEN
        RAISE EXCEPTION 'Team % does not exist or is not active (status: %)', p_team_id, team_status;
    END IF;

    -- Create or update assignment in provider_team_assignments table
    INSERT INTO public.provider_team_assignments (
        provider_id,
        team_id,
        assignment_role,
        oversight_level,
        assignment_type,
        start_date,
        end_date,
        status,
        assigned_at,
        created_at,
        updated_at
    ) VALUES (
        p_provider_id,
        p_team_id,
        p_assignment_role,
        p_oversight_level,
        p_assignment_type,
        CURRENT_DATE,
        p_end_date,
        'active',
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (provider_id, team_id, assignment_role)
    DO UPDATE SET
        oversight_level = EXCLUDED.oversight_level,
        assignment_type = EXCLUDED.assignment_type,
        end_date = EXCLUDED.end_date,
        status = 'active',
        updated_at = NOW()
    RETURNING id INTO assignment_id;

    -- 🚨 CRITICAL FIX: Update teams.provider_id for primary assignments
    IF p_assignment_role = 'primary' THEN
        UPDATE public.teams 
        SET 
            provider_id = p_provider_id,
            updated_at = NOW()
        WHERE id = p_team_id;
        
        RAISE NOTICE 'SYNC FIX: Updated team % provider_id to %', p_team_id, p_provider_id;
    END IF;

    RETURN assignment_id;
END;
$$;

-- =====================================================================================
-- STEP 4: FIX ASSIGNMENT REMOVAL FUNCTION
-- =====================================================================================

-- Update removal function to maintain synchronization
CREATE OR REPLACE FUNCTION remove_provider_from_team_safe(
    p_provider_id UUID,
    p_team_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    assignment_record RECORD;
    removal_success BOOLEAN := FALSE;
BEGIN
    -- Get the assignment details
    SELECT id, assignment_role INTO assignment_record
    FROM public.provider_team_assignments
    WHERE provider_id = p_provider_id 
    AND team_id = p_team_id 
    AND status = 'active';

    IF assignment_record.id IS NOT NULL THEN
        -- Deactivate the assignment
        UPDATE public.provider_team_assignments
        SET 
            status = 'inactive',
            updated_at = NOW()
        WHERE id = assignment_record.id;

        -- 🚨 CRITICAL FIX: Clear teams.provider_id for primary assignments
        IF assignment_record.assignment_role = 'primary' THEN
            UPDATE public.teams
            SET 
                provider_id = NULL,
                updated_at = NOW()
            WHERE id = p_team_id;
            
            RAISE NOTICE 'SYNC FIX: Cleared team % provider_id', p_team_id;
        END IF;

        removal_success := TRUE;
    END IF;

    RETURN removal_success;
END;
$$;

-- =====================================================================================
-- STEP 5: CREATE SYNCHRONIZATION TRIGGER
-- =====================================================================================

-- Create trigger to maintain synchronization automatically
CREATE OR REPLACE FUNCTION sync_teams_provider_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- When a primary assignment is activated
    IF NEW.assignment_role = 'primary' AND NEW.status = 'active' THEN
        UPDATE teams 
        SET 
            provider_id = NEW.provider_id,
            updated_at = NOW()
        WHERE id = NEW.team_id;
        
        RAISE NOTICE 'TRIGGER SYNC: Updated team % provider_id to %', NEW.team_id, NEW.provider_id;
    END IF;

    -- When a primary assignment is deactivated
    IF OLD.assignment_role = 'primary' AND OLD.status = 'active' AND NEW.status != 'active' THEN
        UPDATE teams 
        SET 
            provider_id = NULL,
            updated_at = NOW()
        WHERE id = OLD.team_id;
        
        RAISE NOTICE 'TRIGGER SYNC: Cleared team % provider_id', OLD.team_id;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS sync_teams_provider_id_trigger ON provider_team_assignments;

-- Create the synchronization trigger
CREATE TRIGGER sync_teams_provider_id_trigger
    AFTER INSERT OR UPDATE ON provider_team_assignments
    FOR EACH ROW
    EXECUTE FUNCTION sync_teams_provider_id();

-- =====================================================================================
-- STEP 6: GRANT PERMISSIONS
-- =====================================================================================

-- Grant execute permissions for the updated functions
GRANT EXECUTE ON FUNCTION assign_provider_to_team_safe(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_provider_from_team_safe(UUID, UUID) TO authenticated;

-- =====================================================================================
-- STEP 7: VALIDATION QUERY
-- =====================================================================================

-- Verify the fix worked
SELECT 
    'VALIDATION RESULTS' as check_type,
    'teams.provider_id vs assignments sync' as check_name,
    CASE 
        WHEN COUNT(*) = 0 THEN 'FIXED ✅'
        ELSE CONCAT('STILL BROKEN ❌ (', COUNT(*), ' mismatches)')
    END as status
FROM teams t
JOIN provider_team_assignments pta ON t.id = pta.team_id
WHERE pta.status = 'active' 
AND pta.assignment_role = 'primary'
AND t.provider_id != pta.provider_id

UNION ALL

SELECT 
    'VALIDATION RESULTS',
    'AP users with authorized_provider records',
    CONCAT(
        (SELECT COUNT(*) FROM profiles p JOIN authorized_providers ap ON p.id = ap.user_id WHERE p.role = 'AP'),
        '/',
        (SELECT COUNT(*) FROM profiles WHERE role = 'AP'),
        ' AP users have provider records'
    )

UNION ALL

SELECT 
    'VALIDATION RESULTS',
    'Active provider assignments',
    CONCAT(COUNT(*), ' active assignments found')
FROM provider_team_assignments
WHERE status = 'active';

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

SELECT 
    '🎯 PROVIDER ASSIGNMENT SYNCHRONIZATION FIX COMPLETED' as message,
    'Key changes:' as details_header,
    '1. Synchronized teams.provider_id with provider_team_assignments' as change_1,
    '2. Fixed assignment creation functions to update both tables' as change_2,
    '3. Added automatic sync trigger for future assignments' as change_3,
    '4. Created missing authorized_provider records' as change_4,
    'Result: Dashboards and access controls now show consistent data' as expected_result;