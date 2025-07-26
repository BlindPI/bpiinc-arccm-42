-- Fix AP Certificate Visibility - Comprehensive Solution
-- This ensures AP users can see certificates at locations where they have teams assigned

-- =========================================================================
-- 1. DEBUG: Check current certificate and assignment data
-- =========================================================================

-- First, let's ensure we understand the data structure
-- (This will be commented out in production but helpful for debugging)

-- SELECT COUNT(*) as total_certificates FROM certificates;
-- SELECT COUNT(*) as total_teams FROM teams;
-- SELECT COUNT(*) as total_provider_assignments FROM provider_team_assignments;

-- =========================================================================
-- 2. FIX CERTIFICATE VISIBILITY FOR AP USERS
-- =========================================================================

-- Drop the current certificate policy that may be too restrictive
DROP POLICY IF EXISTS "no_recursion_certificates" ON certificates;

-- Create a more comprehensive policy that specifically handles AP user access
CREATE POLICY "ap_certificate_access" ON certificates
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all certificates
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SA'
    )
    OR
    -- AP users see certificates at locations where they manage teams
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      JOIN teams t ON t.id = pta.team_id
      WHERE ap.user_id = auth.uid()
      AND t.location_id = certificates.location_id
      AND pta.status = 'active'
      AND t.status = 'active'
    )
    OR
    -- Users see certificates at locations where they are team members
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.location_id = certificates.location_id
      AND tm.status = 'active'
      AND t.status = 'active'
    )
  )
);

-- =========================================================================
-- 3. ALSO ENSURE LOCATIONS ARE VISIBLE TO AP USERS
-- =========================================================================

-- Drop the current location policy and make it more specific for AP access
DROP POLICY IF EXISTS "no_recursion_locations" ON locations;

CREATE POLICY "ap_location_access" ON locations
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all locations
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SA'
    )
    OR
    -- AP users see locations where they manage teams
    EXISTS (
      SELECT 1 FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      JOIN teams t ON t.id = pta.team_id
      WHERE ap.user_id = auth.uid()
      AND t.location_id = locations.id
      AND pta.status = 'active'
      AND t.status = 'active'
    )
    OR
    -- Users see locations where they are team members
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
      AND t.location_id = locations.id
      AND tm.status = 'active'
      AND t.status = 'active'
    )
  )
);

-- =========================================================================
-- 4. ENSURE PROVIDER_TEAM_ASSIGNMENTS TABLE IS ACCESSIBLE
-- =========================================================================

-- Make sure AP users can see their own provider team assignments
CREATE POLICY IF NOT EXISTS "provider_assignments_visibility" ON provider_team_assignments
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- System admin sees all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SA'
    )
    OR
    -- Provider can see their own assignments
    EXISTS (
      SELECT 1 FROM authorized_providers ap
      WHERE ap.id = provider_team_assignments.provider_id
      AND ap.user_id = auth.uid()
    )
  )
);

-- Enable RLS on provider_team_assignments if not already enabled
ALTER TABLE provider_team_assignments ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 5. ENSURE AUTHORIZED_PROVIDERS TABLE IS ACCESSIBLE
-- =========================================================================

-- Make sure users can see their own provider records
CREATE POLICY IF NOT EXISTS "authorized_providers_own_access" ON authorized_providers
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'SA'
    )
  )
);

-- Enable RLS on authorized_providers if not already enabled
ALTER TABLE authorized_providers ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- COMMENTS FOR DEBUGGING
-- =========================================================================

COMMENT ON POLICY "ap_certificate_access" ON certificates IS 
'Allows AP users to see certificates at locations where they manage teams via provider_team_assignments';

COMMENT ON POLICY "ap_location_access" ON locations IS 
'Allows AP users to see locations where they manage teams via provider_team_assignments';

COMMENT ON POLICY "provider_assignments_visibility" ON provider_team_assignments IS 
'Allows providers to see their own team assignments';

COMMENT ON POLICY "authorized_providers_own_access" ON authorized_providers IS 
'Allows users to see their own authorized provider records';