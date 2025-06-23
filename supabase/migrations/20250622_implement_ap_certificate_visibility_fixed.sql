-- Implement AP Certificate Visibility Following Team Management Pattern
-- This mirrors the successful Team Management implementation for AP users
-- Flow: AP User -> Location Assignments -> Teams -> Team Members -> Certificate Requests/Certificates

-- Enable RLS on certificate tables if not already enabled
ALTER TABLE certificate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing AP certificate policies to avoid conflicts
DROP POLICY IF EXISTS "ap_users_can_view_team_certificate_requests" ON certificate_requests;
DROP POLICY IF EXISTS "ap_users_can_view_location_certificates" ON certificates;
DROP POLICY IF EXISTS "ap_certificate_requests_access" ON certificate_requests;
DROP POLICY IF EXISTS "ap_certificates_access" ON certificates;
DROP POLICY IF EXISTS "ap_users_can_create_team_certificate_requests" ON certificate_requests;
DROP POLICY IF EXISTS "ap_users_can_update_team_certificate_requests" ON certificate_requests;

-- ================================================================================================
-- CERTIFICATE REQUESTS VISIBILITY FOR AP USERS
-- ================================================================================================

-- Allow AP users to see certificate requests from team members in their assigned locations
-- This follows the exact same pattern as Team Management visibility
CREATE POLICY "ap_users_can_view_team_certificate_requests" ON certificate_requests
FOR SELECT USING (
  -- Check if current user is AP role and has location assignments
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND EXISTS (
      -- Find teams in AP user's assigned locations
      SELECT 1 FROM ap_user_location_assignments apla
      JOIN teams t ON t.location_id = apla.location_id
      JOIN team_members tm ON tm.team_id = t.id
      WHERE apla.ap_user_id = auth.uid()  -- Fixed: use ap_user_id
      AND tm.user_id = certificate_requests.user_id
    )
  )
  OR
  -- Also allow AP users to see their own submitted requests
  certificate_requests.user_id = auth.uid()
);

-- ================================================================================================
-- GENERATED CERTIFICATES VISIBILITY FOR AP USERS
-- ================================================================================================

-- Allow AP users to see generated certificates in their assigned locations
CREATE POLICY "ap_users_can_view_location_certificates" ON certificates
FOR SELECT USING (
  -- Check if current user is AP role with location assignments
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN ap_user_location_assignments apla ON apla.ap_user_id = p.id  -- Fixed: use ap_user_id
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND apla.location_id = certificates.location_id
  )
  OR
  -- Also allow viewing certificates issued by the AP user
  certificates.issued_by = auth.uid()
);

-- ================================================================================================
-- INSERT/UPDATE PERMISSIONS FOR AP USERS
-- ================================================================================================

-- Allow AP users to create certificate requests for their team members
CREATE POLICY "ap_users_can_create_team_certificate_requests" ON certificate_requests
FOR INSERT WITH CHECK (
  -- Check if AP user can create requests for team members in assigned locations
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND EXISTS (
      SELECT 1 FROM ap_user_location_assignments apla
      JOIN teams t ON t.location_id = apla.location_id
      JOIN team_members tm ON tm.team_id = t.id
      WHERE apla.ap_user_id = auth.uid()  -- Fixed: use ap_user_id
      AND tm.user_id = certificate_requests.user_id
    )
  )
  OR
  -- Allow creating own requests
  certificate_requests.user_id = auth.uid()
);

-- Allow AP users to update certificate requests from their team members
CREATE POLICY "ap_users_can_update_team_certificate_requests" ON certificate_requests
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND EXISTS (
      SELECT 1 FROM ap_user_location_assignments apla
      JOIN teams t ON t.location_id = apla.location_id
      JOIN team_members tm ON tm.team_id = t.id
      WHERE apla.ap_user_id = auth.uid()  -- Fixed: use ap_user_id
      AND tm.user_id = certificate_requests.user_id
    )
  )
);

-- ================================================================================================
-- PERFORMANCE INDEXES
-- ================================================================================================

-- Create indexes to optimize the RLS policy queries
CREATE INDEX IF NOT EXISTS idx_certificate_requests_user_id_status ON certificate_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_certificates_location_id_status ON certificates(location_id, status);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_by ON certificates(issued_by);
CREATE INDEX IF NOT EXISTS idx_ap_user_location_assignments_ap_user_location ON ap_user_location_assignments(ap_user_id, location_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_teams_location_id ON teams(location_id);

-- ================================================================================================
-- GRANT PERMISSIONS
-- ================================================================================================

-- Ensure AP users have the necessary table permissions
GRANT SELECT, INSERT, UPDATE ON certificate_requests TO authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT ON ap_user_location_assignments TO authenticated;
GRANT SELECT ON teams TO authenticated;
GRANT SELECT ON team_members TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- ================================================================================================
-- VERIFICATION QUERIES
-- ================================================================================================

-- Add comments for verification
COMMENT ON POLICY "ap_users_can_view_team_certificate_requests" ON certificate_requests IS 
'Allows AP users to view certificate requests from team members in their assigned locations. Mirrors Team Management visibility pattern.';

COMMENT ON POLICY "ap_users_can_view_location_certificates" ON certificates IS 
'Allows AP users to view generated certificates in their assigned locations.';

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'AP Certificate Visibility Implementation Complete:';
  RAISE NOTICE '✅ RLS policies created for certificate_requests and certificates tables';
  RAISE NOTICE '✅ AP users can now see certificate requests from team members in assigned locations';
  RAISE NOTICE '✅ AP users can see generated certificates in assigned locations';  
  RAISE NOTICE '✅ Performance indexes created with correct column names (ap_user_id)';
  RAISE NOTICE '✅ Pattern mirrors successful Team Management implementation';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test AP user certificate visibility in dashboard';
  RAISE NOTICE '2. Verify certificate management tabs show data';
  RAISE NOTICE '3. Confirm team member attribution in submissions';
  RAISE NOTICE '4. Validate certificate count matches dashboard metrics';
END $$;