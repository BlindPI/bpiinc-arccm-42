-- Fix provider location functions to use INTEGER instead of UUID
-- The authorized_providers table uses bigint (number) IDs, not UUIDs

-- Drop all existing versions of the functions
DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);
DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);
DROP FUNCTION IF EXISTS get_provider_location_kpis(INTEGER);
DROP FUNCTION IF EXISTS get_provider_location_teams(INTEGER);

-- Create the correct functions with INTEGER parameters
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
    COALESCE(COUNT(DISTINCT pt.user_id), 0)::INTEGER as total_instructors,
    COALESCE(COUNT(DISTINCT CASE WHEN pt.status = 'active' THEN pt.user_id END), 0)::INTEGER as active_instructors,
    COALESCE(COUNT(DISTINCT c.id), 0)::INTEGER as total_courses,
    COALESCE(COUNT(DISTINCT cert.id), 0)::INTEGER as certificates_issued,
    COALESCE(AVG(CASE WHEN pt.performance_score IS NOT NULL THEN pt.performance_score ELSE 85.0 END), 85.0)::NUMERIC as compliance_score,
    COALESCE(AVG(CASE WHEN pt.performance_score IS NOT NULL THEN pt.performance_score ELSE 85.0 END), 85.0)::NUMERIC as performance_rating
  FROM authorized_providers ap
  LEFT JOIN provider_teams pt ON ap.id = pt.provider_id
  LEFT JOIN courses c ON ap.id = c.provider_id
  LEFT JOIN certifications cert ON c.id = cert.course_id
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
      85.0::NUMERIC as performance_rating;
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
    pt.id as team_id,
    COALESCE(pt.team_name, 'Team ' || pt.id::TEXT) as team_name,
    COALESCE(pt.team_description, '') as team_description,
    COALESCE(l.name, 'Unknown Location') as location_name,
    COUNT(pt.user_id)::INTEGER as member_count,
    COALESCE(AVG(pt.performance_score), 85.0)::NUMERIC as performance_score
  FROM provider_teams pt
  LEFT JOIN authorized_providers ap ON pt.provider_id = ap.id
  LEFT JOIN locations l ON ap.primary_location_id = l.id
  WHERE pt.provider_id = p_provider_id
  GROUP BY pt.id, pt.team_name, pt.team_description, l.name
  ORDER BY pt.team_name;
END;
$$;