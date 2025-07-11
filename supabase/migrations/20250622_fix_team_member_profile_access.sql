-- Fix team member profile access for AP users
-- This migration ensures AP users can read profile data for team members they manage

-- Enable RLS on profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be blocking access
DROP POLICY IF EXISTS "team_member_profiles_select" ON profiles;
DROP POLICY IF EXISTS "ap_team_member_access" ON profiles;

-- Create policy to allow team managers to read member profiles
CREATE POLICY "team_member_profiles_select" ON profiles
FOR SELECT USING (
  -- Users can read their own profile
  auth.uid() = id
  OR
  -- AP users can read profiles of their team members
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    WHERE tm.user_id = profiles.id
    AND t.ap_user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR
  -- System admins can read all profiles
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

-- Ensure team_members table has proper RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing team_members policies
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

-- Create comprehensive team_members policies
CREATE POLICY "team_members_select" ON team_members
FOR SELECT USING (
  -- AP users can see members of their teams
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.ap_user_id = auth.uid()
  )
  OR
  -- Users can see their own memberships
  user_id = auth.uid()
  OR
  -- System admins can see all
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "team_members_insert" ON team_members
FOR INSERT WITH CHECK (
  -- AP users can add members to their teams
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.ap_user_id = auth.uid()
  )
  OR
  -- System admins can add members to any team
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "team_members_update" ON team_members
FOR UPDATE USING (
  -- AP users can update members of their teams
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.ap_user_id = auth.uid()
  )
  OR
  -- System admins can update any team member
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "team_members_delete" ON team_members
FOR DELETE USING (
  -- AP users can remove members from their teams
  EXISTS (
    SELECT 1 FROM teams t
    WHERE t.id = team_members.team_id
    AND t.ap_user_id = auth.uid()
  )
  OR
  -- System admins can remove any team member
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

-- Ensure teams table has proper RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing teams policies
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

-- Create comprehensive teams policies
CREATE POLICY "teams_select" ON teams
FOR SELECT USING (
  -- AP users can see their own teams
  ap_user_id = auth.uid()
  OR
  -- Team members can see teams they belong to
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = teams.id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR
  -- System admins can see all teams
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "teams_insert" ON teams
FOR INSERT WITH CHECK (
  -- AP users can create teams assigned to themselves
  ap_user_id = auth.uid()
  OR
  -- System admins can create any team
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "teams_update" ON teams
FOR UPDATE USING (
  -- AP users can update their own teams
  ap_user_id = auth.uid()
  OR
  -- System admins can update any team
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

CREATE POLICY "teams_delete" ON teams
FOR DELETE USING (
  -- AP users can delete their own teams
  ap_user_id = auth.uid()
  OR
  -- System admins can delete any team
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id_user_id ON team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_ap_user_id ON teams(ap_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Grant necessary permissions
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';