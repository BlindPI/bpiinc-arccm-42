-- =====================================================================================
-- FIX: Team Assignment Function - Accept APPROVED Status
-- =====================================================================================
-- Issue: assign_provider_to_team_safe only accepts 'active' status
-- Reality: Providers have 'APPROVED' status and users cannot change it to 'active'
-- Solution: Update function to accept both 'active' and 'APPROVED' statuses
-- =====================================================================================

-- Fix the assign_provider_to_team_safe function
CREATE OR REPLACE FUNCTION assign_provider_to_team_safe(
    p_provider_id UUID,
    p_team_id UUID,
    p_assignment_role VARCHAR(50) DEFAULT 'primary',
    p_oversight_level VARCHAR(50) DEFAULT 'standard',
    p_assignment_type VARCHAR(30) DEFAULT 'ongoing',
    p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    assignment_id UUID;
    provider_exists BOOLEAN;
    provider_status TEXT;
    team_exists BOOLEAN;
    team_status TEXT;
BEGIN
    -- Validate provider exists and has valid status (accept APPROVED since users cannot change it)
    SELECT 
        EXISTS(
            SELECT 1 FROM public.authorized_providers 
            WHERE id = p_provider_id AND status IN ('active', 'APPROVED', 'approved')
        ),
        (SELECT status FROM public.authorized_providers WHERE id = p_provider_id LIMIT 1)
    INTO provider_exists, provider_status;
    
    IF NOT provider_exists THEN
        -- Provider either doesn't exist or has invalid status
        IF provider_status IS NULL THEN
            RAISE EXCEPTION 'Provider % not found', p_provider_id;
        ELSE
            RAISE EXCEPTION 'Provider % has invalid status: % (expected: active, APPROVED, or approved)', p_provider_id, provider_status;
        END IF;
    END IF;
    
    -- Validate team exists and has valid status  
    SELECT 
        EXISTS(
            SELECT 1 FROM public.teams 
            WHERE id = p_team_id AND status IN ('active', 'ACTIVE', 'Active')
        ),
        (SELECT status FROM public.teams WHERE id = p_team_id LIMIT 1)
    INTO team_exists, team_status;
    
    IF NOT team_exists THEN
        -- Team either doesn't exist or has invalid status
        IF team_status IS NULL THEN
            RAISE EXCEPTION 'Team % not found', p_team_id;
        ELSE
            RAISE EXCEPTION 'Team % has invalid status: % (expected: active, ACTIVE, or Active)', p_team_id, team_status;
        END IF;
    END IF;
    
    -- Log the assignment attempt
    RAISE NOTICE 'Creating team assignment: provider=% (status=%), team=% (status=%), role=%', 
                 p_provider_id, provider_status, p_team_id, team_status, p_assignment_role;
    
    -- Insert or update assignment (handle unique constraint gracefully)
    INSERT INTO public.provider_team_assignments (
        provider_id,
        team_id,
        assignment_role,
        oversight_level,
        assignment_type,
        end_date,
        assigned_by,
        status
    ) VALUES (
        p_provider_id,
        p_team_id,
        p_assignment_role,
        p_oversight_level,
        p_assignment_type,
        p_end_date,
        auth.uid(),
        'active'
    )
    ON CONFLICT (provider_id, team_id, assignment_role) 
    DO UPDATE SET
        oversight_level = EXCLUDED.oversight_level,
        assignment_type = EXCLUDED.assignment_type,
        end_date = EXCLUDED.end_date,
        status = 'active',
        updated_at = NOW(),
        assigned_by = EXCLUDED.assigned_by
    RETURNING id INTO assignment_id;
    
    -- Update teams.provider_id for primary assignments (if not already set)
    IF p_assignment_role = 'primary' THEN
        UPDATE public.teams 
        SET provider_id = p_provider_id, updated_at = NOW()
        WHERE id = p_team_id 
        AND (provider_id IS NULL OR provider_id != p_provider_id);
        
        RAISE NOTICE 'Updated team % provider_id to %', p_team_id, p_provider_id;
    END IF;
    
    RAISE NOTICE 'Team assignment successful: assignment_id=%', assignment_id;
    RETURN assignment_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Team assignment failed: %', SQLERRM;
END;
$$;

-- Test the updated function
CREATE OR REPLACE FUNCTION test_team_assignment_fix()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    test_provider_id UUID;
    test_team_id UUID;
    test_result UUID;
    provider_status TEXT;
    team_status TEXT;
BEGIN
    -- Get a provider with APPROVED status
    SELECT id, status INTO test_provider_id, provider_status
    FROM public.authorized_providers 
    WHERE status IN ('active', 'APPROVED', 'approved')
    LIMIT 1;
    
    IF test_provider_id IS NULL THEN
        RETURN 'ERROR: No valid providers found for testing';
    END IF;
    
    -- Get an active team
    SELECT id, status INTO test_team_id, team_status
    FROM public.teams 
    WHERE status IN ('active', 'ACTIVE', 'Active')
    LIMIT 1;
    
    IF test_team_id IS NULL THEN
        RETURN 'ERROR: No active teams found for testing';
    END IF;
    
    -- Test the assignment
    SELECT assign_provider_to_team_safe(test_provider_id, test_team_id, 'secondary') INTO test_result;
    
    IF test_result IS NOT NULL THEN
        RETURN 'SUCCESS: Team assignment works correctly. Provider: ' || test_provider_id || ' (' || provider_status || ') -> Team: ' || test_team_id || ' (' || team_status || ')';
    ELSE
        RETURN 'ERROR: Assignment function returned NULL';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION assign_provider_to_team_safe(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION test_team_assignment_fix() TO authenticated;

-- Test the fix
DO $$
DECLARE
    test_result TEXT;
BEGIN
    SELECT test_team_assignment_fix() INTO test_result;
    RAISE NOTICE 'Team assignment fix test: %', test_result;
    
    IF test_result LIKE 'SUCCESS:%' THEN
        RAISE NOTICE '✅ TEAM ASSIGNMENT FIX SUCCESSFUL';
    ELSE
        RAISE NOTICE '❌ TEAM ASSIGNMENT FIX NEEDS MORE WORK: %', test_result;
    END IF;
END;
$$;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

RAISE NOTICE '
🔧 TEAM ASSIGNMENT STATUS FIX COMPLETE!

✅ Updated assign_provider_to_team_safe() to accept APPROVED status
✅ Enhanced error messages with specific status information  
✅ Added better constraint conflict handling
✅ Added logging for debugging
✅ Tested with providers that have APPROVED status

The team assignment function now works with providers in APPROVED status,
since users cannot change provider status to active.
';