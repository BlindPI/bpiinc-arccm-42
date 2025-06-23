-- Implement AP Rosters Visibility Following Team Management Pattern
-- This extends the certificate visibility fix to include rosters

-- Enable RLS on rosters table if not already enabled
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;

-- Drop existing AP roster policies to avoid conflicts
DROP POLICY IF EXISTS "ap_users_can_view_location_rosters" ON rosters;
DROP POLICY IF EXISTS "ap_users_can_create_location_rosters" ON rosters;
DROP POLICY IF EXISTS "ap_users_can_update_location_rosters" ON rosters;

-- ================================================================================================
-- ROSTERS VISIBILITY FOR AP USERS
-- ================================================================================================

-- Allow AP users to see rosters in their assigned locations
CREATE POLICY "ap_users_can_view_location_rosters" ON rosters
FOR SELECT USING (
  -- Check if current user is AP role with location assignments
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN ap_user_location_assignments apla ON apla.ap_user_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND apla.location_id = rosters.location_id
  )
  OR
  -- Also allow viewing rosters created by the AP user
  rosters.created_by = auth.uid()
);

-- Allow AP users to create rosters in their assigned locations
CREATE POLICY "ap_users_can_create_location_rosters" ON rosters
FOR INSERT WITH CHECK (
  -- Check if AP user can create rosters in assigned locations
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN ap_user_location_assignments apla ON apla.ap_user_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND apla.location_id = rosters.location_id
  )
  OR
  -- Allow creating rosters where they are the creator
  rosters.created_by = auth.uid()
);

-- Allow AP users to update rosters in their assigned locations
CREATE POLICY "ap_users_can_update_location_rosters" ON rosters
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN ap_user_location_assignments apla ON apla.ap_user_id = p.id
    WHERE p.id = auth.uid() 
    AND p.role = 'AP'
    AND apla.location_id = rosters.location_id
  )
);

-- ================================================================================================
-- PERFORMANCE INDEXES
-- ================================================================================================

-- Create indexes to optimize the RLS policy queries
CREATE INDEX IF NOT EXISTS idx_rosters_location_id_status ON rosters(location_id, status);
CREATE INDEX IF NOT EXISTS idx_rosters_created_by ON rosters(created_by);

-- ================================================================================================
-- GRANT PERMISSIONS
-- ================================================================================================

-- Ensure AP users have the necessary table permissions
GRANT SELECT, INSERT, UPDATE ON rosters TO authenticated;

-- ================================================================================================
-- VERIFICATION QUERIES
-- ================================================================================================

-- Add comments for verification
COMMENT ON POLICY "ap_users_can_view_location_rosters" ON rosters IS 
'Allows AP users to view rosters in their assigned locations. Mirrors Team Management visibility pattern.';

-- Log the completion
DO $$
BEGIN
  RAISE NOTICE 'AP Rosters Visibility Implementation Complete:';
  RAISE NOTICE '✅ RLS policies created for rosters table';
  RAISE NOTICE '✅ AP users can now see rosters in their assigned locations';
  RAISE NOTICE '✅ Performance indexes created';
  RAISE NOTICE '✅ Pattern mirrors successful Team Management implementation';
  RAISE NOTICE '';
  RAISE NOTICE 'AP users can now see:';
  RAISE NOTICE '- Certificate requests from team members in assigned locations';
  RAISE NOTICE '- Generated certificates in assigned locations';
  RAISE NOTICE '- Rosters in assigned locations';
  RAISE NOTICE '- Clear team member attribution in all submissions';
END $$;