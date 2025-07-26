-- Fix Dashboard RLS Policies for Data Visibility
-- This migration addresses critical RLS policy issues preventing dashboard from showing data

-- =========================================================================
-- 1. FIX TEAMS TABLE RLS POLICIES
-- =========================================================================

-- Drop existing potentially conflicting policies on teams
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON teams;
DROP POLICY IF EXISTS "Teams viewable by members" ON teams;
DROP POLICY IF EXISTS "Teams accessible to authorized providers" ON teams;

-- Add comprehensive team visibility policy
CREATE POLICY "dashboard_teams_visibility" ON teams
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- User is a member of this team
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid() 
      AND tm.status = 'active'
    )
    OR
    -- User is an AP managing this team via provider assignments
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      WHERE pta.team_id = teams.id 
      AND ap.user_id = auth.uid()
      AND pta.status = 'active'
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

-- =========================================================================
-- 2. FIX TEAM_MEMBERS TABLE RLS POLICIES  
-- =========================================================================

-- Drop existing potentially conflicting policies on team_members
DROP POLICY IF EXISTS "Team members are viewable by team members" ON team_members;
DROP POLICY IF EXISTS "Team members viewable by providers" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;

-- Add comprehensive team members visibility policy
CREATE POLICY "dashboard_team_members_visibility" ON team_members
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User can see themselves
    user_id = auth.uid()
    OR
    -- User is a member of the same team
    EXISTS (
      SELECT 1 FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.user_id = auth.uid() 
      AND tm2.status = 'active'
    )
    OR
    -- User is an AP managing this team
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      WHERE pta.team_id = team_members.team_id 
      AND ap.user_id = auth.uid()
      AND pta.status = 'active'
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

-- =========================================================================
-- 3. FIX CERTIFICATES TABLE RLS POLICIES
-- =========================================================================

-- Drop conflicting policies on certificates (keep only necessary ones)
DROP POLICY IF EXISTS "Certificates viewable by location team members" ON certificates;
DROP POLICY IF EXISTS "Users can view certificates in their teams locations" ON certificates;
DROP POLICY IF EXISTS "Certificates are viewable by team members at location" ON certificates;

-- Add streamlined certificate visibility policy
CREATE POLICY "dashboard_certificates_visibility" ON certificates
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User is a team member at this location
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.location_id = certificates.location_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND t.status = 'active'
    )
    OR
    -- User is an AP managing teams at this location
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      JOIN teams t ON t.id = pta.team_id
      WHERE t.location_id = certificates.location_id
      AND ap.user_id = auth.uid()
      AND pta.status = 'active'
      AND t.status = 'active'
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

-- =========================================================================
-- 4. ADD TEAM MEMBER PROFILE VISIBILITY RLS POLICY
-- =========================================================================

-- Drop existing conflicting profile policies
DROP POLICY IF EXISTS "Team member profiles visible to team members" ON profiles;
DROP POLICY IF EXISTS "Profiles viewable by team members" ON profiles;

-- Add team member profile visibility policy
CREATE POLICY "dashboard_team_member_profiles_visibility" ON profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User can see their own profile
    id = auth.uid()
    OR
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

-- =========================================================================
-- 5. FIX LOCATIONS TABLE RLS POLICIES
-- =========================================================================

-- Drop overlapping location policies
DROP POLICY IF EXISTS "Locations viewable by team members" ON locations;
DROP POLICY IF EXISTS "Users can view locations of their teams" ON locations;
DROP POLICY IF EXISTS "Locations accessible to providers" ON locations;

-- Add consolidated location visibility policy
CREATE POLICY "dashboard_locations_visibility" ON locations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User has teams at this location
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE t.location_id = locations.id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND t.status = 'active'
    )
    OR
    -- User is an AP managing teams at this location
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      JOIN teams t ON t.id = pta.team_id
      WHERE t.location_id = locations.id
      AND ap.user_id = auth.uid()
      AND pta.status = 'active'
      AND t.status = 'active'
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

-- =========================================================================
-- 6. REMOVE OVERLAPPING CERTIFICATE_REQUESTS POLICIES 
-- =========================================================================

-- Clean up any remaining certificate_requests policies that might conflict
DROP POLICY IF EXISTS "Certificate requests viewable by location teams" ON certificate_requests;
DROP POLICY IF EXISTS "Users can view certificate requests at their locations" ON certificate_requests;

-- Note: We're not adding new certificate_requests policies since the dashboard
-- now uses the certificates table instead

-- =========================================================================
-- 7. ENSURE RLS IS ENABLED ON ALL RELEVANT TABLES
-- =========================================================================

-- Ensure RLS is enabled on all dashboard-critical tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- COMMENTS
-- =========================================================================

COMMENT ON POLICY "dashboard_teams_visibility" ON teams IS 
'Allows dashboard to show teams where user is a member or AP managing the team';

COMMENT ON POLICY "dashboard_team_members_visibility" ON team_members IS 
'Allows dashboard to show team member information for teams user has access to';

COMMENT ON POLICY "dashboard_certificates_visibility" ON certificates IS 
'Allows dashboard to show certificates at locations where user has team access';

COMMENT ON POLICY "dashboard_team_member_profiles_visibility" ON profiles IS 
'Allows dashboard to show profile information for team members in accessible teams';

COMMENT ON POLICY "dashboard_locations_visibility" ON locations IS 
'Allows dashboard to show locations where user has team access or management rights';