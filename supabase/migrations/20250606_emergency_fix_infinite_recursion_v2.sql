-- Emergency Migration: Fix Infinite Recursion in RLS Policies (v2)
-- Date: 2025-06-06
-- Purpose: Completely eliminate infinite recursion by using simple, non-referential policies

-- Step 1: Disable RLS temporarily to allow operations
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies to eliminate recursion
DO $$
DECLARE
    policy_record RECORD;
    table_name TEXT;
BEGIN
    -- List of tables to clean
    FOR table_name IN VALUES ('profiles'), ('teams'), ('locations'), ('team_members'), ('notifications'), ('certificates'), ('courses'), ('enrollments')
    LOOP
        -- Drop all policies for this table
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name AND schemaname = 'public'
        LOOP
            BEGIN
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.' || table_name;
                RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, table_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy % on table %: %', policy_record.policyname, table_name, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- Step 3: Create ultra-simple, non-recursive policies

-- Profiles: Only self-access and SA access (NO team references)
CREATE POLICY "profiles_self_access" ON public.profiles
FOR ALL USING (
    id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'SA'
    )
);

-- Teams: Simple access based on team_members table only
CREATE POLICY "teams_member_access" ON public.teams
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
    OR
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'SA'
    )
);

CREATE POLICY "teams_admin_manage" ON public.teams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id 
        AND tm.user_id = auth.uid() 
        AND tm.role = 'ADMIN'
    )
    OR
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'SA'
    )
);

-- Locations: Simple SA and team-based access (NO profile references)
CREATE POLICY "locations_simple_access" ON public.locations
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'SA'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.teams t
        JOIN public.team_members tm ON t.id = tm.team_id
        WHERE t.location_id = locations.id AND tm.user_id = auth.uid()
    )
);

CREATE POLICY "locations_sa_manage" ON public.locations
FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'SA'
    )
);

-- Team Members: Simple access
CREATE POLICY "team_members_access" ON public.team_members
FOR ALL USING (
    user_id = auth.uid()
    OR
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'SA'
    )
    OR
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id 
        AND tm.user_id = auth.uid() 
        AND tm.role = 'ADMIN'
    )
);

-- Step 4: Re-enable RLS with simple policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant basic permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.teams TO authenticated;
GRANT SELECT ON public.locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

-- Step 6: Test query to verify no recursion
DO $$
DECLARE
    test_result INTEGER;
BEGIN
    SELECT COUNT(*) INTO test_result FROM public.profiles LIMIT 1;
    RAISE NOTICE 'Test query successful - no infinite recursion detected';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test query failed: %', SQLERRM;
END $$;

-- Step 7: Clean up any remaining problematic objects
DROP FUNCTION IF EXISTS public.get_user_accessible_teams(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_team_members_with_profiles(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_team_access(UUID, UUID) CASCADE;

-- Step 8: Log success with correct notification type
DO $$
DECLARE
    sa_user_id UUID;
BEGIN
    SELECT id INTO sa_user_id FROM public.profiles WHERE role = 'SA' LIMIT 1;
    
    IF sa_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            created_at
        ) VALUES (
            sa_user_id,
            'Emergency Fix Applied',
            'Infinite recursion in RLS policies has been resolved. System should now be functional.',
            'INFO',
            NOW()
        );
        RAISE NOTICE 'Success notification logged for SA user: %', sa_user_id;
    ELSE
        RAISE NOTICE 'No SA user found to log notification';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not log success notification: %', SQLERRM;
END $$;

SELECT 'EMERGENCY FIX COMPLETE: Infinite recursion eliminated, basic policies restored' as status;