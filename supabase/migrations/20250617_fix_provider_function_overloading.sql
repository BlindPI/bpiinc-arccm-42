-- Fix provider location function overloading issues
-- This migration resolves PGRST203 errors by ensuring only one version of each function exists

-- Drop all existing versions of the conflicting functions
DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);
DROP FUNCTION IF EXISTS get_provider_location_kpis(BIGINT);
DROP FUNCTION IF EXISTS get_provider_location_kpis(INTEGER);
DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);
DROP FUNCTION IF EXISTS get_provider_location_teams(BIGINT);
DROP FUNCTION IF EXISTS get_provider_location_teams(INTEGER);

-- Create the definitive INTEGER-only versions
CREATE OR REPLACE FUNCTION get_provider_location_kpis(p_provider_id INTEGER)
RETURNS TABLE (
  total_instructors INTEGER,
  active_instructors INTEGER,
  total_courses INTEGER,
  certificates_issued INTEGER,
  compliance_score NUMERIC,
  performance_rating NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(COUNT(DISTINCT ap.id)::INTEGER, 0) as total_instructors,
    COALESCE(COUNT(DISTINCT CASE WHEN ap.status = 'active' THEN ap.id END)::INTEGER, 0) as active_instructors,
    COALESCE(COUNT(DISTINCT c.id)::INTEGER, 0) as total_courses,
    COALESCE(COUNT(DISTINCT cert.id)::INTEGER, 0) as certificates_issued,
    COALESCE(AVG(CASE WHEN ap.compliance_score IS NOT NULL THEN ap.compliance_score ELSE 85.0 END), 85.0) as compliance_score,
    COALESCE(AVG(CASE WHEN ap.performance_rating IS NOT NULL THEN ap.performance_rating ELSE 4.2 END), 4.2) as performance_rating
  FROM authorized_providers ap
  LEFT JOIN courses c ON c.instructor_id = ap.user_id
  LEFT JOIN certificates cert ON cert.instructor_id = ap.user_id
  WHERE ap.id = p_provider_id
  GROUP BY ap.id;
  
  -- If no data found, return default values
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      0::INTEGER as total_instructors,
      0::INTEGER as active_instructors,
      0::INTEGER as total_courses,
      0::INTEGER as certificates_issued,
      85.0::NUMERIC as compliance_score,
      4.2::NUMERIC as performance_rating;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION get_provider_location_teams(p_provider_id INTEGER)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  team_description TEXT,
  location_name TEXT,
  member_count INTEGER,
  performance_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.name as team_name,
    COALESCE(t.description, '') as team_description,
    COALESCE(l.name, 'Unknown Location') as location_name,
    COALESCE(COUNT(tm.id)::INTEGER, 0) as member_count,
    COALESCE(AVG(CASE WHEN tm.performance_score IS NOT NULL THEN tm.performance_score ELSE 4.0 END), 4.0) as performance_score
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id
  LEFT JOIN locations l ON l.id = t.location_id
  LEFT JOIN authorized_providers ap ON ap.primary_location_id = t.location_id
  WHERE ap.id = p_provider_id
  GROUP BY t.id, t.name, t.description, l.name
  ORDER BY t.name;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_provider_location_kpis(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_location_teams(INTEGER) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION get_provider_location_kpis(INTEGER) IS 'Get KPI metrics for a specific provider location - INTEGER parameter only';
COMMENT ON FUNCTION get_provider_location_teams(INTEGER) IS 'Get team information for a specific provider location - INTEGER parameter only';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Provider location function overloading fixed - only INTEGER versions remain';
END;
$$;