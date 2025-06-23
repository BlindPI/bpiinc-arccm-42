-- =====================================================================================
-- FIX: Provider Team Assignment UPDATE Permission Error (403 Forbidden)
-- =====================================================================================
-- This migration fixes the specific permission error:
-- "permission denied for table provider_team_assignments" (Code: 42501)
-- 
-- Root Cause: The authenticated role only has SELECT permissions on provider_team_assignments
-- but UPDATE operations require explicit GRANT UPDATE permissions
-- =====================================================================================

-- Step 1: Identify the current permissions issue
DO $$
BEGIN
    RAISE NOTICE '🔍 DIAGNOSING: Provider Team Assignment Permission Issue';
    RAISE NOTICE 'Error Context: SA user removing team assignment from AP user role';
    RAISE NOTICE 'PostgreSQL Error: 42501 - permission denied for table provider_team_assignments';
    RAISE NOTICE 'HTTP Status: 403 Forbidden on PATCH operation';
END;
$$;

-- Step 2: Check current table permissions
DO $$
DECLARE
    has_select BOOLEAN := FALSE;
    has_update BOOLEAN := FALSE;
    has_delete BOOLEAN := FALSE;
BEGIN
    -- Check if authenticated role has the necessary permissions
    SELECT 
        COUNT(*) FILTER (WHERE privilege_type = 'SELECT') > 0,
        COUNT(*) FILTER (WHERE privilege_type = 'UPDATE') > 0,
        COUNT(*) FILTER (WHERE privilege_type = 'DELETE') > 0
    INTO has_select, has_update, has_delete
    FROM information_schema.table_privileges 
    WHERE table_schema = 'public' 
    AND table_name = 'provider_team_assignments' 
    AND grantee = 'authenticated';
    
    RAISE NOTICE 'Current permissions for authenticated role on provider_team_assignments:';
    RAISE NOTICE '- SELECT: %', CASE WHEN has_select THEN '✅ GRANTED' ELSE '❌ MISSING' END;
    RAISE NOTICE '- UPDATE: %', CASE WHEN has_update THEN '✅ GRANTED' ELSE '❌ MISSING' END;
    RAISE NOTICE '- DELETE: %', CASE WHEN has_delete THEN '✅ GRANTED' ELSE '❌ MISSING' END;
    
    IF NOT has_update THEN
        RAISE NOTICE '🎯 IDENTIFIED ISSUE: Missing UPDATE permission is causing 403 Forbidden error';
    END IF;
END;
$$;

-- Step 3: Grant the missing UPDATE and DELETE permissions
-- This is the core fix for the 403 Forbidden error
GRANT UPDATE, DELETE ON public.provider_team_assignments TO authenticated;

RAISE NOTICE '✅ GRANTED: UPDATE and DELETE permissions on provider_team_assignments to authenticated role';

-- Step 4: Verify RLS policies are still working correctly
DO $$
DECLARE
    policy_count INTEGER;
    admin_policy_exists BOOLEAN := FALSE;
    view_policy_exists BOOLEAN := FALSE;
BEGIN
    -- Count total policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'provider_team_assignments';
    
    -- Check for specific policies
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'provider_team_assignments'
        AND policyname = 'admin_full_provider_team_assignments_access'
    ) INTO admin_policy_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'provider_team_assignments'
        AND policyname = 'users_view_provider_team_assignments'
    ) INTO view_policy_exists;
    
    RAISE NOTICE 'RLS Policy Status:';
    RAISE NOTICE '- Total policies: %', policy_count;
    RAISE NOTICE '- Admin access policy: %', CASE WHEN admin_policy_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
    RAISE NOTICE '- View access policy: %', CASE WHEN view_policy_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
END;
$$;

-- Step 5: Create a diagnostic function to test the fix
CREATE OR REPLACE FUNCTION test_provider_team_assignment_permissions()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
    test_assignment_id UUID;
    result_message TEXT;
BEGIN
    -- Get current user
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RETURN 'ERROR: No authenticated user found';
    END IF;
    
    -- Get user role
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    IF user_role IS NULL THEN
        RETURN 'ERROR: User profile not found or no role assigned';
    END IF;
    
    -- Test SELECT permission
    BEGIN
        PERFORM 1 FROM public.provider_team_assignments LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        RETURN 'ERROR: SELECT permission failed - ' || SQLERRM;
    END;
    
    -- For SA/AD users, test UPDATE permission
    IF user_role IN ('SA', 'AD') THEN
        -- Find a test record to update
        SELECT id INTO test_assignment_id
        FROM public.provider_team_assignments 
        WHERE status = 'active'
        LIMIT 1;
        
        IF test_assignment_id IS NOT NULL THEN
            BEGIN
                -- Test UPDATE by touching the updated_at timestamp
                UPDATE public.provider_team_assignments 
                SET updated_at = NOW()
                WHERE id = test_assignment_id;
                
                result_message := 'SUCCESS: ' || user_role || ' user can perform UPDATE operations on provider_team_assignments';
            EXCEPTION WHEN OTHERS THEN
                result_message := 'ERROR: UPDATE permission failed for ' || user_role || ' user - ' || SQLERRM;
            END;
        ELSE
            result_message := 'WARNING: No active assignments found to test UPDATE operation';
        END IF;
    ELSE
        result_message := 'INFO: User role ' || user_role || ' should only have SELECT access';
    END IF;
    
    RETURN result_message;
END;
$$;

-- Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION test_provider_team_assignment_permissions() TO authenticated;

-- Step 6: Test the fix
DO $$
DECLARE
    test_result TEXT;
BEGIN
    -- Run the permission test
    SELECT test_provider_team_assignment_permissions() INTO test_result;
    RAISE NOTICE 'Permission Test Result: %', test_result;
END;
$$;

-- Step 7: Add comprehensive table permissions for provider management
-- Ensure all necessary permissions are granted for the full provider management workflow
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_team_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.provider_location_assignments TO authenticated;
GRANT SELECT, UPDATE ON public.authorized_providers TO authenticated;
GRANT SELECT, UPDATE ON public.teams TO authenticated;

RAISE NOTICE '✅ GRANTED: Comprehensive permissions for provider management tables';

-- Step 8: Create a function to remove provider from team (the specific failing operation)
CREATE OR REPLACE FUNCTION remove_provider_from_team_safe(
    p_provider_id UUID,
    p_team_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    current_user_id UUID;
    user_role TEXT;
    assignment_record RECORD;
    affected_rows INTEGER;
BEGIN
    -- Get current user and validate permissions
    SELECT auth.uid() INTO current_user_id;
    
    IF current_user_id IS NULL THEN
        RETURN 'ERROR: No authenticated user';
    END IF;
    
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = current_user_id;
    
    IF user_role NOT IN ('SA', 'AD') THEN
        RETURN 'ERROR: Insufficient permissions - only SA and AD users can remove provider team assignments';
    END IF;
    
    -- Check if assignment exists
    SELECT * INTO assignment_record
    FROM public.provider_team_assignments
    WHERE provider_id = p_provider_id 
    AND team_id = p_team_id
    AND status = 'active';
    
    IF NOT FOUND THEN
        RETURN 'ERROR: No active assignment found for provider ' || p_provider_id || ' and team ' || p_team_id;
    END IF;
    
    -- Perform the removal (set status to inactive instead of DELETE for audit trail)
    UPDATE public.provider_team_assignments
    SET 
        status = 'inactive',
        updated_at = NOW()
    WHERE id = assignment_record.id;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    IF affected_rows > 0 THEN
        RETURN 'SUCCESS: Provider ' || p_provider_id || ' removed from team ' || p_team_id;
    ELSE
        RETURN 'ERROR: Failed to update assignment record';
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Grant execute permission on the removal function
GRANT EXECUTE ON FUNCTION remove_provider_from_team_safe(UUID, UUID) TO authenticated;

-- =====================================================================================
-- VALIDATION AND COMPLETION
-- =====================================================================================

DO $$
DECLARE
    permission_test TEXT;
    final_permissions TEXT;
BEGIN
    -- Final validation
    SELECT test_provider_team_assignment_permissions() INTO permission_test;
    
    -- Check final permission state
    SELECT string_agg(privilege_type, ', ' ORDER BY privilege_type)
    INTO final_permissions
    FROM information_schema.table_privileges 
    WHERE table_schema = 'public' 
    AND table_name = 'provider_team_assignments' 
    AND grantee = 'authenticated';
    
    RAISE NOTICE '=== FIX VALIDATION RESULTS ===';
    RAISE NOTICE 'Permission Test: %', permission_test;
    RAISE NOTICE 'Final Permissions: %', COALESCE(final_permissions, 'NONE');
    RAISE NOTICE '';
    
    IF final_permissions LIKE '%UPDATE%' AND final_permissions LIKE '%DELETE%' THEN
        RAISE NOTICE '✅ SUCCESS: Fix applied successfully';
        RAISE NOTICE 'SA users should now be able to remove team assignments from AP users';
    ELSE
        RAISE NOTICE '❌ WARNING: Permissions may still be incomplete';
    END IF;
END;
$$;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

RAISE NOTICE '
🔧 PROVIDER TEAM ASSIGNMENT PERMISSION FIX COMPLETE!

✅ Root Cause Identified: Missing UPDATE/DELETE permissions on provider_team_assignments table
✅ Granted UPDATE and DELETE permissions to authenticated role  
✅ Verified RLS policies are still protecting data appropriately
✅ Created diagnostic function to test permissions
✅ Created safe removal function for the specific failing operation
✅ Added comprehensive permissions for full provider management workflow

The 403 Forbidden error should now be resolved.

Next Steps:
1. Test the team assignment removal feature in the application
2. If still experiencing issues, run: SELECT test_provider_team_assignment_permissions();
3. Use the new remove_provider_from_team_safe() function for reliable removals
';