-- ==============================================
-- FIX RPC FUNCTION TYPE MISMATCHES
-- ==============================================

-- Fix the team member profiles function to handle varchar/text type mismatches
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
    COALESCE(p.display_name, p.email, 'User ' || SUBSTRING(tm.user_id::text, 1, 8))::text as display_name,
    COALESCE(p.email, '')::text,
    COALESCE(p.phone, '')::text,
    COALESCE(p.job_title, '')::text,
    COALESCE(p.role, '')::text,
    COALESCE(tm.role, '')::text as team_role,
    COALESCE(tm.team_position, '')::text,
    tm.status::text,
    tm.created_at
  FROM team_members tm
  LEFT JOIN profiles p ON tm.user_id = p.id
  WHERE tm.team_id = p_team_id
    AND tm.status = 'active';
END;
$$;

-- Test the fixed function
SELECT 'TEST_FIXED_TEAM_PROFILES' as test_name, user_id, display_name, email, team_role
FROM get_team_member_profiles(
  (SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%' LIMIT 1)
);