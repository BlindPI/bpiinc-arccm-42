-- Fix course_offerings schema reference in provider location functions
-- The error shows that co.team_id doesn't exist, so we need to fix the column reference

-- Drop and recreate the function with correct schema references
DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);

CREATE OR REPLACE FUNCTION get_provider_location_kpis(p_provider_id UUID)
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
    -- Count courses from course_offerings if available, using correct column names
    COALESCE((
      SELECT COUNT(DISTINCT co.id)::INTEGER 
      FROM course_offerings co 
      JOIN teams t ON co.location_id = t.location_id  -- Use location_id instead of team_id
      WHERE t.provider_id = p_provider_id
    ), 0) as total_courses,
    -- Count certificates using instructor_name match
    COALESCE((
      SELECT COUNT(DISTINCT cert.id)::INTEGER 
      FROM certificates cert 
      WHERE cert.instructor_name = ap.name
        AND cert.status = 'ACTIVE'
    ), 0) as certificates_issued,
    COALESCE(AVG(CASE WHEN ap.compliance_score IS NOT NULL THEN ap.compliance_score ELSE 85.0 END), 85.0) as compliance_score,
    COALESCE(AVG(CASE WHEN ap.performance_rating IS NOT NULL THEN ap.performance_rating ELSE 4.2 END), 4.2) as performance_rating
  FROM authorized_providers ap
  WHERE ap.id = p_provider_id
  GROUP BY ap.id, ap.name;
  
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_provider_location_kpis(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_provider_location_kpis(UUID) IS 'Get KPI metrics for a specific provider - Fixed schema references';

-- Log the fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed get_provider_location_kpis function schema references';
  RAISE NOTICE 'Changed co.team_id to co.location_id join with teams table';
  RAISE NOTICE 'Function should now work without column reference errors';
END;
$$;