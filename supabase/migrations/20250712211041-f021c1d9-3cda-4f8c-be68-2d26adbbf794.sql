-- Create security definer function to get user role without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  current_user_id UUID;
BEGIN
  -- Get the current user ID from auth context
  current_user_id := auth.uid();
  
  -- If no authenticated user, return null
  IF current_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the user's role from profiles table
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = current_user_id
  LIMIT 1;
  
  -- Return the role (could be null if profile doesn't exist)
  RETURN user_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and return null to prevent policy failures
    RAISE WARNING 'Error in get_current_user_role(): %', SQLERRM;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- Drop all existing policies on teams table
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

-- Create the single comprehensive policy for SA/AD users using the security definer function
CREATE POLICY "sa_ad_full_access" ON public.teams
FOR ALL 
USING (public.get_current_user_role() IN ('SA', 'AD'))
WITH CHECK (public.get_current_user_role() IN ('SA', 'AD'));

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