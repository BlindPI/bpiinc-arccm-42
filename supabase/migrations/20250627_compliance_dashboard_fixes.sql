
-- Fix compliance_metrics table to add missing columns
ALTER TABLE compliance_metrics 
ADD COLUMN IF NOT EXISTS required_for_basic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS required_for_robust BOOLEAN DEFAULT FALSE;

-- Update existing records to have proper tier requirements
UPDATE compliance_metrics 
SET required_for_basic = TRUE 
WHERE name IN ('Resume Upload', 'Background Check', 'Company Information');

UPDATE compliance_metrics 
SET required_for_robust = TRUE 
WHERE name IN ('Resume Upload', 'Background Check', 'Company Information', 'Training Completion', 'Certification Upload', 'Insurance Documentation', 'Continuing Education');

-- Create function to get real compliance analytics
CREATE OR REPLACE FUNCTION get_compliance_analytics()
RETURNS TABLE (
  metric_name text,
  basic_completion_rate numeric,
  robust_completion_rate numeric,
  total_users_basic bigint,
  total_users_robust bigint,
  completed_basic bigint,
  completed_robust bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.name as metric_name,
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN p.compliance_tier = 'basic' AND ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
         NULLIF(COUNT(CASE WHEN p.compliance_tier = 'basic' THEN 1 END), 0) * 100), 2
      ), 0
    ) as basic_completion_rate,
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN p.compliance_tier = 'robust' AND ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
         NULLIF(COUNT(CASE WHEN p.compliance_tier = 'robust' THEN 1 END), 0) * 100), 2
      ), 0
    ) as robust_completion_rate,
    COUNT(CASE WHEN p.compliance_tier = 'basic' THEN 1 END) as total_users_basic,
    COUNT(CASE WHEN p.compliance_tier = 'robust' THEN 1 END) as total_users_robust,
    COUNT(CASE WHEN p.compliance_tier = 'basic' AND ucr.compliance_status = 'approved' THEN 1 END) as completed_basic,
    COUNT(CASE WHEN p.compliance_tier = 'robust' AND ucr.compliance_status = 'approved' THEN 1 END) as completed_robust
  FROM compliance_metrics cm
  CROSS JOIN profiles p
  LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id AND ucr.metric_id = cm.id
  WHERE p.compliance_tier IS NOT NULL
  GROUP BY cm.id, cm.name
  ORDER BY cm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get tier distribution data
CREATE OR REPLACE FUNCTION get_tier_distribution()
RETURNS TABLE (
  tier_name text,
  user_count bigint,
  completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.compliance_tier, 'unassigned') as tier_name,
    COUNT(*) as user_count,
    COALESCE(
      ROUND(
        (COUNT(CASE WHEN ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
         NULLIF(COUNT(ucr.id), 0) * 100), 2
      ), 0
    ) as completion_percentage
  FROM profiles p
  LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id
  GROUP BY p.compliance_tier
  ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_compliance_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_distribution() TO authenticated;
