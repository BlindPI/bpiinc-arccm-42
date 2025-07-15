-- Fix the compliance records setup with correct field mapping
-- Create user compliance records for IC users who don't have them

INSERT INTO user_compliance_records (
  user_id,
  metric_id,
  requirement_id,
  compliance_status,
  tier,
  completion_percentage,
  due_date
)
SELECT 
  p.id as user_id,
  cr.id as metric_id,
  cr.id as requirement_id,
  'pending' as compliance_status,
  'basic' as tier,
  0 as completion_percentage,
  (CURRENT_DATE + INTERVAL '30 days') as due_date
FROM profiles p
CROSS JOIN compliance_requirements cr
WHERE p.role = 'IC' 
  AND p.compliance_tier = 'basic'
  AND cr.tier_level = 'basic'
  AND cr.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_compliance_records ucr 
    WHERE ucr.user_id = p.id AND ucr.requirement_id = cr.id
  );