-- EMERGENCY ROLLBACK: Fix broken role recognition
-- The profiles RLS policy is preventing users from seeing their own profile

-- Immediately drop the problematic profiles policy
DROP POLICY IF EXISTS "dashboard_team_member_profiles_visibility" ON profiles;

-- Restore basic profile access policy - users can ALWAYS see their own profile
CREATE POLICY "users_can_view_own_profile" ON profiles
FOR SELECT
USING (auth.uid() = id);

-- Add separate policy for team member profile visibility that doesn't interfere with own profile
CREATE POLICY "team_members_can_view_each_other" ON profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  auth.uid() != id AND (  -- Only for OTHER users, not self
    -- User can see profiles of other team members in same teams
    EXISTS (
      SELECT 1 FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid()
      AND tm2.user_id = profiles.id
      AND tm1.status = 'active'
      AND tm2.status = 'active'
    )
    OR
    -- AP can see profiles of team members they manage
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      JOIN team_members tm ON tm.team_id = pta.team_id
      WHERE ap.user_id = auth.uid()
      AND tm.user_id = profiles.id
      AND pta.status = 'active'
      AND tm.status = 'active'
    )
    OR
    -- System admin access
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'SA'
    )
  )
);

-- Ensure the policy comments are clear
COMMENT ON POLICY "users_can_view_own_profile" ON profiles IS 
'CRITICAL: Users must always be able to see their own profile for role recognition';

COMMENT ON POLICY "team_members_can_view_each_other" ON profiles IS 
'Allows viewing other team member profiles without interfering with own profile access';