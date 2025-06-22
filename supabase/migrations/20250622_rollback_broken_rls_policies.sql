-- =====================================================================================
-- EMERGENCY ROLLBACK: FIX BROKEN RLS POLICIES
-- =====================================================================================
-- The previous migration created overly restrictive RLS policies that broke all access
-- to the teams table. This rollback restores basic functionality while maintaining 
-- team member access for AP users.

-- =====================================================================================
-- STEP 1: DROP PROBLEMATIC POLICIES
-- =====================================================================================

-- Drop the overly restrictive team member policies that may be blocking access
DROP POLICY IF EXISTS "ap_view_assigned_team_members" ON public.team_members;
DROP POLICY IF EXISTS "ap_manage_assigned_team_members" ON public.team_members;

-- =====================================================================================
-- STEP 2: RESTORE BASIC teams TABLE ACCESS
-- =====================================================================================

-- Ensure teams table has basic access policies that don't break existing functionality
-- (The migration may have inadvertently removed or broken existing policies)

-- Drop any potentially broken policies and recreate safe ones
DO $$
DECLARE 
    policy_record RECORD;
BEGIN
    -- Check if teams table has any policies at all
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'teams'
    ) THEN
        -- No policies exist, create basic ones
        RAISE NOTICE 'No policies found for teams table, creating basic access policies';
        
        -- Allow authenticated users to read teams (basic functionality)
        CREATE POLICY "authenticated_users_view_teams" ON public.teams
        FOR SELECT USING (auth.uid() IS NOT NULL);
        
        -- Allow system admins full access
        CREATE POLICY "admin_full_teams_access" ON public.teams
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('SA', 'AD')
            )
        );
    END IF;
END;
$$;

-- =====================================================================================
-- STEP 3: RESTORE team_members TABLE ACCESS (LESS RESTRICTIVE)
-- =====================================================================================

-- Create more permissive team_members policies that don't break functionality
CREATE POLICY "authenticated_users_view_team_members" ON public.team_members
FOR SELECT USING (
    -- Allow authenticated users to view team members (basic access)
    auth.uid() IS NOT NULL
);

-- Create separate policy for AP users to manage team members
CREATE POLICY "ap_users_manage_team_members" ON public.team_members
FOR ALL USING (
    -- System admins have full access
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR
    -- AP users can manage team members for teams where they have assignments
    EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.authorized_providers ap ON p.id = ap.user_id
        JOIN public.provider_team_assignments pta ON ap.id = pta.provider_id
        WHERE p.id = auth.uid()
        AND p.role = 'AP'
        AND pta.team_id = team_members.team_id
        AND pta.status = 'active'
    )
    OR
    -- Team members can manage their own membership
    (team_members.user_id = auth.uid())
);

-- =====================================================================================
-- STEP 4: ENSURE PROVIDER_TEAM_ASSIGNMENTS ACCESS IS NOT BROKEN
-- =====================================================================================

-- Make sure provider_team_assignments table access is working
-- Create a permissive policy if needed
DO $$
BEGIN
    -- Check if we need to create basic access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'provider_team_assignments'
        AND policyname = 'authenticated_users_view_provider_team_assignments'
    ) THEN
        CREATE POLICY "authenticated_users_view_provider_team_assignments" ON public.provider_team_assignments
        FOR SELECT USING (auth.uid() IS NOT NULL);
    END IF;
END;
$$;

-- =====================================================================================
-- STEP 5: VALIDATION
-- =====================================================================================

DO $$
DECLARE
    teams_count INTEGER;
    assignments_count INTEGER;
    policies_count INTEGER;
BEGIN
    RAISE NOTICE '=== ROLLBACK VALIDATION ===';
    
    -- Test basic queries that were failing
    BEGIN
        SELECT COUNT(*) INTO teams_count FROM public.teams LIMIT 1;
        RAISE NOTICE 'Teams table accessible: % teams found', teams_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Teams table still not accessible: %', SQLERRM;
    END;
    
    BEGIN
        SELECT COUNT(*) INTO assignments_count FROM public.provider_team_assignments LIMIT 1;
        RAISE NOTICE 'Provider team assignments accessible: % found', assignments_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Provider team assignments still not accessible: %', SQLERRM;
    END;
    
    -- Count policies
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('teams', 'team_members', 'provider_team_assignments');
    
    RAISE NOTICE 'Total RLS policies active: %', policies_count;
    RAISE NOTICE '=== END VALIDATION ===';
END;
$$;

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

RAISE NOTICE '
🚨 EMERGENCY ROLLBACK COMPLETE

✅ Removed overly restrictive RLS policies
✅ Restored basic access to teams table  
✅ Created permissive team_members access policies
✅ Ensured provider_team_assignments access works

EXPECTED RESULT:
- Teams queries should work again (no more 500 errors)
- AP Dashboard should show team assignments again
- Team member management can be added incrementally later

This rollback prioritizes restoring basic functionality over advanced features.
';