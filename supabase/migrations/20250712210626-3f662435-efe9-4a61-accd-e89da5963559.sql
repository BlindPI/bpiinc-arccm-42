-- Check existing policies on teams table and clean up properly
-- First, let's see what exists
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- List all existing policies on teams table
    FOR policy_record IN
        SELECT policyname, cmd, permissive
        FROM pg_policies
        WHERE tablename = 'teams' AND schemaname = 'public'
    LOOP
        RAISE NOTICE 'Found policy: % (%) - %', policy_record.policyname, policy_record.cmd, 
            CASE WHEN policy_record.permissive THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END;
    END LOOP;
END $$;

-- Now drop all policies and recreate clean ones
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'teams' AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.teams';
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Create the single comprehensive policy for SA/AD users
CREATE POLICY "sa_ad_full_access" ON public.teams
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

-- Create policy for team members to view their teams
CREATE POLICY "users_can_view_member_teams" ON public.teams
FOR SELECT 
USING (
  id IN (
    SELECT DISTINCT tm.team_id 
    FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);

-- Create policy for team admins to manage their teams  
CREATE POLICY "team_admins_manage_teams" ON public.teams
FOR ALL 
USING (
  id IN (
    SELECT DISTINCT tm.team_id 
    FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'ADMIN'
    AND tm.status = 'active'
  )
)
WITH CHECK (
  id IN (
    SELECT DISTINCT tm.team_id 
    FROM public.team_members tm
    WHERE tm.user_id = auth.uid()
    AND tm.role = 'ADMIN'
    AND tm.status = 'active'
  )
);