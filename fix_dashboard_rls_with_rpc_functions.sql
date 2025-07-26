-- ==============================================
-- FIX DASHBOARD RLS USING RPC FUNCTIONS
-- ==============================================
-- Based on working ProviderRelationshipService patterns
-- Avoid infinite recursion by using RPC functions instead of complex RLS

-- =============================================
-- 1. CREATE RPC FUNCTIONS FOR SAFE DATA ACCESS
-- =============================================

-- Function to get team member profiles safely (bypasses RLS)
CREATE OR REPLACE FUNCTION get_team_member_profiles(p_team_id uuid)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  email text,
  phone text,
  job_title text,
  role text,
  team_role text,
  team_position text,
  status text,
  created_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tm.user_id,
    COALESCE(p.display_name, p.email, 'User ' || SUBSTRING(tm.user_id::text, 1, 8)) as display_name,
    p.email,
    p.phone,
    p.job_title,
    p.role,
    tm.role as team_role,
    tm.team_position,
    tm.status,
    tm.created_at
  FROM team_members tm
  LEFT JOIN profiles p ON tm.user_id = p.id
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active';
END;
$$;

-- Function to get rosters by location for AP users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_location_rosters(p_location_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  created_by uuid,
  creator_name text,
  created_at timestamptz,
  status text,
  certificate_count integer,
  course_id uuid,
  location_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.created_by,
    COALESCE(p.display_name, p.email, 'User ' || SUBSTRING(r.created_by::text, 1, 8)) as creator_name,
    r.created_at,
    r.status,
    r.certificate_count,
    r.course_id,
    r.location_id
  FROM rosters r
  LEFT JOIN profiles p ON r.created_by = p.id
  WHERE r.location_id = p_location_id
    AND r.status = 'ACTIVE'
  ORDER BY r.created_at DESC;
END;
$$;

-- Function to get user rosters (for team member roster counts)
CREATE OR REPLACE FUNCTION get_user_rosters(p_user_id uuid, p_location_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  name text,
  created_at timestamptz,
  status text,
  certificate_count integer,
  location_id uuid
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
BEGIN
  IF p_location_id IS NOT NULL THEN
    -- Filter by location for AP users
    RETURN QUERY
    SELECT 
      r.id,
      r.name,
      r.created_at,
      r.status,
      r.certificate_count,
      r.location_id
    FROM rosters r
    WHERE r.created_by = p_user_id
      AND r.location_id = p_location_id
      AND r.status = 'ACTIVE'
    ORDER BY r.created_at DESC;
  ELSE
    -- No location filter for non-AP users
    RETURN QUERY
    SELECT 
      r.id,
      r.name,
      r.created_at,
      r.status,
      r.certificate_count,
      r.location_id
    FROM rosters r
    WHERE r.created_by = p_user_id
      AND r.status = 'ACTIVE'
    ORDER BY r.created_at DESC;
  END IF;
END;
$$;

-- Function to get AP user's assigned location
CREATE OR REPLACE FUNCTION get_ap_user_location(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
AS $$
DECLARE
  user_location_id uuid;
BEGIN
  SELECT ap.primary_location_id
  INTO user_location_id
  FROM authorized_providers ap
  WHERE ap.user_id = p_user_id
    AND ap.status = 'APPROVED';
    
  RETURN user_location_id;
END;
$$;

-- =============================================
-- 2. REMOVE PROBLEMATIC RLS POLICIES
-- =============================================

-- Remove the recursive RLS policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all rosters" ON rosters;
DROP POLICY IF EXISTS "Admins can update all rosters" ON rosters;

-- =============================================
-- 3. CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =============================================

-- Simple admin access without recursive profile queries
CREATE POLICY "rpc_admin_roster_access" ON rosters
  FOR SELECT USING (
    -- Use auth.jwt() to get role directly from JWT token (no recursion)
    (auth.jwt() ->> 'user_role') IN ('SA', 'AD')
  );

-- Simple user own roster access
CREATE POLICY "users_own_rosters" ON rosters
  FOR SELECT USING (auth.uid() = created_by);

-- =============================================
-- 4. GRANT EXECUTE PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_team_member_profiles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_location_rosters(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rosters(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_location(uuid) TO authenticated;

-- =============================================
-- 5. TEST THE NEW FUNCTIONS
-- =============================================

-- Test 1: Get team member profiles for Barrie First Aid team
SELECT 'TEST_TEAM_PROFILES' as test_name, user_id, display_name, email, team_role
FROM get_team_member_profiles(
  (SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%' LIMIT 1)
);

-- Test 2: Get rosters for Barrie First Aid location
SELECT 'TEST_LOCATION_ROSTERS' as test_name, id, name, creator_name, created_at
FROM get_location_rosters('d4bcc036-101f-4339-b5e8-ea4e1347e83a')
LIMIT 5;

-- Test 3: Get AP user's assigned location
SELECT 'TEST_AP_LOCATION' as test_name, get_ap_user_location(auth.uid()) as location_id;