-- Create user compliance records using existing compliance metrics for IC users
-- Use metrics that are relevant to instructors (similar to IN role)

INSERT INTO user_compliance_records (
  user_id,
  metric_id,
  compliance_status,
  tier,
  completion_percentage,
  due_date
)
SELECT 
  p.id as user_id,
  cm.id as metric_id,
  'pending' as compliance_status,
  'basic' as tier,
  0 as completion_percentage,
  (CURRENT_DATE + INTERVAL '30 days') as due_date
FROM profiles p
CROSS JOIN compliance_metrics cm
WHERE p.role = 'IC' 
  AND p.compliance_tier = 'basic'
  AND (cm.required_for_roles @> ARRAY['IN'] OR cm.required_for_roles @> ARRAY['AP'])
  AND cm.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_compliance_records ucr 
    WHERE ucr.user_id = p.id AND ucr.metric_id = cm.id
  );