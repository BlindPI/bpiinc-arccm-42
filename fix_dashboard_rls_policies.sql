-- ==============================================
-- FIX DASHBOARD RLS POLICIES 
-- ==============================================
-- Based on comprehensive debug analysis showing:
-- 1. Profiles table blocks team member visibility (only own_profile_access)
-- 2. Rosters table blocks AP location-based access
-- 3. Data exists but RLS policies are too restrictive

-- =============================================
-- 1. FIX PROFILES TABLE ACCESS FOR TEAM FUNCTIONALITY
-- =============================================

-- Allow team members to view profiles of other team members in their team
CREATE POLICY "team_members_can_view_team_profiles" ON profiles
  FOR SELECT USING (
    -- Allow if current user is a team member and target profile is also a team member of same team
    EXISTS (
      SELECT 1 
      FROM team_members tm1
      JOIN team_members tm2 ON tm1.team_id = tm2.team_id
      WHERE tm1.user_id = auth.uid() 
        AND tm2.user_id = profiles.id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
  );

-- Allow AP users to view profiles of team members in their location teams
CREATE POLICY "ap_users_can_view_location_team_profiles" ON profiles
  FOR SELECT USING (
    -- Allow if current user is AP and target profile is team member at AP's location
    EXISTS (
      SELECT 1
      FROM authorized_providers ap
      JOIN teams t ON ap.primary_location_id = t.location_id
      JOIN team_members tm ON t.id = tm.team_id
      WHERE ap.user_id = auth.uid()
        AND tm.user_id = profiles.id
        AND tm.status = 'active'
        AND ap.status = 'APPROVED'
    )
  );

-- Allow admins to view team member profiles for management
CREATE POLICY "admins_can_view_team_profiles" ON profiles
  FOR SELECT USING (
    -- Allow if current user is admin (SA/AD)
    (SELECT role FROM profiles WHERE id = auth.uid()) = ANY (ARRAY['SA'::text, 'AD'::text])
  );

-- =============================================
-- 2. FIX ROSTERS TABLE ACCESS FOR AP LOCATION-BASED VIEWING
-- =============================================

-- Allow AP users to view rosters for their assigned location
CREATE POLICY "ap_users_can_view_location_rosters" ON rosters
  FOR SELECT USING (
    -- Allow if current user is AP and roster belongs to their assigned location
    EXISTS (
      SELECT 1
      FROM authorized_providers ap
      WHERE ap.user_id = auth.uid()
        AND ap.primary_location_id = rosters.location_id
        AND ap.status = 'APPROVED'
    )
  );

-- Allow team members to view rosters from their team's location
CREATE POLICY "team_members_can_view_team_location_rosters" ON rosters
  FOR SELECT USING (
    -- Allow if current user is team member and roster is from their team's location
    EXISTS (
      SELECT 1
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid()
        AND t.location_id = rosters.location_id
        AND tm.status = 'active'
    )
  );

-- =============================================
-- 3. VERIFY NEW POLICIES WORK
-- =============================================

-- Test 1: Verify AP user can now access location rosters
SELECT 
  'AP_ROSTER_ACCESS_TEST' as test_name,
  r.id as roster_id,
  r.name as roster_name,
  r.location_id,
  l.name as location_name,
  'SHOULD_BE_ACCESSIBLE_NOW' as expected_result
FROM locations l
LEFT JOIN rosters r ON l.id = r.location_id AND r.status = 'ACTIVE'
WHERE l.id IN (
  SELECT ap.primary_location_id
  FROM authorized_providers ap
  WHERE ap.user_id = auth.uid()
)
ORDER BY r.created_at DESC
LIMIT 10;

-- Test 2: Verify team member profile access
SELECT 
  'TEAM_PROFILE_ACCESS_TEST' as test_name,
  tm.user_id,
  p.display_name,
  p.email,
  'SHOULD_BE_ACCESSIBLE_NOW' as expected_result
FROM team_members tm
LEFT JOIN profiles p ON tm.user_id = p.id
WHERE tm.team_id IN (
  SELECT team_id FROM team_members WHERE user_id = auth.uid()
)
AND tm.status = 'active'
ORDER BY p.display_name;

-- =============================================
-- 4. REFRESH RLS POLICIES (if needed)
-- =============================================

-- Force refresh of RLS policy cache
NOTIFY pgrst, 'reload schema';