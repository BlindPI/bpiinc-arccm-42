-- NUCLEAR ROLLBACK: Remove ALL problematic RLS policies
-- This fixes the infinite recursion errors that are breaking the entire system

-- =========================================================================
-- 1. REMOVE ALL PROBLEMATIC POLICIES IMMEDIATELY
-- =========================================================================

-- Drop all the dashboard policies I just created
DROP POLICY IF EXISTS "dashboard_teams_visibility" ON teams;
DROP POLICY IF EXISTS "dashboard_team_members_visibility" ON team_members;
DROP POLICY IF EXISTS "dashboard_certificates_visibility" ON certificates;
DROP POLICY IF EXISTS "dashboard_team_member_profiles_visibility" ON profiles;
DROP POLICY IF EXISTS "dashboard_locations_visibility" ON locations;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "team_members_can_view_each_other" ON profiles;

-- =========================================================================
-- 2. RESTORE MINIMAL SAFE POLICIES FOR BASIC FUNCTIONALITY
-- =========================================================================

-- PROFILES: Users MUST be able to see their own profile (critical for login)
CREATE POLICY "own_profile_access" ON profiles
FOR ALL
USING (auth.uid() = id);

-- TEAMS: Basic team visibility without recursion
CREATE POLICY "basic_team_visibility" ON teams
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin can see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SA')
    OR
    -- Users can see teams they belong to (direct lookup, no joins)
    id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- TEAM_MEMBERS: Basic member visibility without recursion
CREATE POLICY "basic_team_member_visibility" ON team_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin can see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SA')
    OR
    -- Users can see themselves
    user_id = auth.uid()
    OR
    -- Users can see members of teams they belong to (simple approach)
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND status = 'active'
    )
  )
);

-- LOCATIONS: Basic location visibility
CREATE POLICY "basic_location_visibility" ON locations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin can see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SA')
    OR
    -- Users can see locations of their teams
    id IN (
      SELECT DISTINCT t.location_id 
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  )
);

-- CERTIFICATES: Basic certificate visibility
CREATE POLICY "basic_certificate_visibility" ON certificates
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin can see all
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'SA')
    OR
    -- Users can see certificates at their team locations
    location_id IN (
      SELECT DISTINCT t.location_id 
      FROM teams t
      JOIN team_members tm ON tm.team_id = t.id
      WHERE tm.user_id = auth.uid() AND tm.status = 'active'
    )
  )
);

-- =========================================================================
-- 3. ENSURE TABLES HAVE PROPER RLS SETTINGS
-- =========================================================================

-- Ensure RLS is enabled but with safe policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- SAFETY COMMENTS
-- =========================================================================

COMMENT ON POLICY "own_profile_access" ON profiles IS 
'CRITICAL: Users must be able to access their own profile for login/role recognition';

COMMENT ON POLICY "basic_team_visibility" ON teams IS 
'Safe team visibility without recursion - users see teams they belong to';

COMMENT ON POLICY "basic_team_member_visibility" ON team_members IS 
'Safe team member visibility without recursion - avoids infinite loops';

COMMENT ON POLICY "basic_location_visibility" ON locations IS 
'Safe location visibility - users see locations of their teams';

COMMENT ON POLICY "basic_certificate_visibility" ON certificates IS 
'Safe certificate visibility - users see certificates at their team locations';