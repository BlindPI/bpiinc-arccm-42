-- ==============================================
-- EMERGENCY ROLLBACK OF RLS POLICIES
-- ==============================================
-- Remove the policies that are causing infinite recursion

-- Drop the problematic policies we just created
DROP POLICY IF EXISTS "team_members_can_view_team_profiles" ON profiles;
DROP POLICY IF EXISTS "ap_users_can_view_location_team_profiles" ON profiles;
DROP POLICY IF EXISTS "admins_can_view_team_profiles" ON profiles;
DROP POLICY IF EXISTS "ap_users_can_view_location_rosters" ON rosters;
DROP POLICY IF EXISTS "team_members_can_view_team_location_rosters" ON rosters;

-- Verify current policies remain
SELECT 
  'REMAINING_PROFILES_POLICIES' as section,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' AND schemaname = 'public';

SELECT 
  'REMAINING_ROSTERS_POLICIES' as section,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'rosters' AND schemaname = 'public';