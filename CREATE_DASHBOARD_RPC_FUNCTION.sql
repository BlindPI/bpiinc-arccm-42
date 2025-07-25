-- Create RPC function to get dashboard data that bypasses RLS issues
-- This mimics the pattern used by get_user_availability_for_date_range

CREATE OR REPLACE FUNCTION get_user_dashboard_data(
  requesting_user_id UUID,
  requesting_user_role TEXT DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_role TEXT,
  location_id UUID,
  location_name TEXT,
  certificate_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get the user's role if not provided
  IF requesting_user_role IS NULL THEN
    SELECT role INTO requesting_user_role
    FROM profiles 
    WHERE id = requesting_user_id;
  END IF;

  -- For AP users: Get teams via provider_team_assignments
  IF requesting_user_role = 'AP' THEN
    RETURN QUERY
    SELECT 
      t.id as team_id,
      t.name as team_name,
      pta.assignment_role as team_role,
      t.location_id,
      l.name as location_name,
      COALESCE(
        (SELECT COUNT(*) FROM certificate_requests cr WHERE cr.location_id = t.location_id),
        0
      ) as certificate_count
    FROM provider_team_assignments pta
    JOIN teams t ON t.id = pta.team_id
    LEFT JOIN locations l ON l.id = t.location_id
    WHERE pta.provider_id = requesting_user_id
      AND pta.status = 'active'
      AND t.status = 'active'
      AND (l.status = 'ACTIVE' OR l.status IS NULL);
      
  -- For other users: Get teams via team_members
  ELSE
    RETURN QUERY
    SELECT 
      t.id as team_id,
      t.name as team_name,
      tm.role as team_role,
      t.location_id,
      l.name as location_name,
      COALESCE(
        (SELECT COUNT(*) FROM certificate_requests cr WHERE cr.location_id = t.location_id),
        0
      ) as certificate_count
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    LEFT JOIN locations l ON l.id = t.location_id
    WHERE tm.user_id = requesting_user_id
      AND tm.status = 'active'
      AND t.status = 'active'
      AND (l.status = 'ACTIVE' OR l.status IS NULL);
  END IF;
  
END;
$$;

-- Test the function with "The Test User"
SELECT 
  'RPC FUNCTION TEST' as test_type,
  team_id,
  team_name,
  team_role,
  location_name,
  certificate_count
FROM get_user_dashboard_data('45b269a1-eaf9-4e75-b0b4-3baf1e9c905e', 'AP');