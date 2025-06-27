
-- Function to get pending compliance submissions
CREATE OR REPLACE FUNCTION get_pending_compliance_submissions()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  user_name text,
  metric_name text,
  submitted_at timestamp with time zone,
  current_value text,
  compliance_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ucr.id,
    ucr.user_id,
    COALESCE(p.display_name, p.email) as user_name,
    COALESCE(ucr.metric_name, 'General Compliance') as metric_name,
    ucr.created_at as submitted_at,
    COALESCE(ucr.current_value, 'No value provided') as current_value,
    ucr.compliance_status
  FROM user_compliance_records ucr
  JOIN profiles p ON ucr.user_id = p.id
  WHERE ucr.compliance_status = 'pending'
  ORDER BY ucr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_compliance_submissions() TO authenticated;
