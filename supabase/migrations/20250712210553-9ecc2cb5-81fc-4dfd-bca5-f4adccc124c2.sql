-- Fix team creation permission issues by cleaning up conflicting RLS policies
-- The issue is multiple overlapping policies causing conflicts

-- First, drop all existing team-related policies to start clean
DROP POLICY IF EXISTS "sa_full_access_teams" ON public.teams;
DROP POLICY IF EXISTS "ad_full_access_teams" ON public.teams;
DROP POLICY IF EXISTS "users_can_view_member_teams" ON public.teams;
DROP POLICY IF EXISTS "team_admins_manage_teams" ON public.teams;
DROP POLICY IF EXISTS "SA users can insert teams" ON public.teams;
DROP POLICY IF EXISTS "AD users can insert teams" ON public.teams;
DROP POLICY IF EXISTS "teams_insert_sa_ad" ON public.teams;
DROP POLICY IF EXISTS "Admins can insert teams" ON public.teams;

-- Create a single comprehensive policy for SA/AD users
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