
-- Function to get compliance completion statistics
CREATE OR REPLACE FUNCTION get_compliance_completion_stats()
RETURNS TABLE (
  tier text,
  total_users bigint,
  completed_users bigint,
  avg_completion_percentage numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.compliance_tier, 'basic') as tier,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT CASE WHEN ucr.compliance_status = 'approved' THEN p.id END) as completed_users,
    COALESCE(
      ROUND(
        (COUNT(DISTINCT CASE WHEN ucr.compliance_status = 'approved' THEN p.id END)::numeric / 
         NULLIF(COUNT(DISTINCT p.id), 0) * 100), 2
      ), 0
    ) as avg_completion_percentage
  FROM profiles p
  LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id
  WHERE p.compliance_tier IS NOT NULL
  GROUP BY COALESCE(p.compliance_tier, 'basic');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_compliance_completion_stats() TO authenticated;
