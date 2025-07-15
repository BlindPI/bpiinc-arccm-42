-- Initialize compliance requirements for IC basic tier users
-- First, let's check if compliance_requirements for IC basic exist and create some sample data

-- Insert basic IC compliance requirements if they don't exist
INSERT INTO compliance_requirements (
  name, 
  description, 
  requirement_type, 
  category, 
  tier_level, 
  is_mandatory, 
  due_days_from_assignment, 
  points_value,
  is_active
)
SELECT 
  'Resume Upload',
  'Current resume demonstrating teaching experience',
  'document',
  'documentation',
  'basic',
  true,
  30,
  30,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_requirements 
  WHERE name = 'Resume Upload' AND tier_level = 'basic'
);

INSERT INTO compliance_requirements (
  name, 
  description, 
  requirement_type, 
  category, 
  tier_level, 
  is_mandatory, 
  due_days_from_assignment, 
  points_value,
  is_active
)
SELECT 
  'Background Check',
  'Current background check clearance',
  'document',
  'background_check',
  'basic',
  true,
  30,
  70,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM compliance_requirements 
  WHERE name = 'Background Check' AND tier_level = 'basic'
);

-- Create user compliance records for IC users who don't have them
INSERT INTO user_compliance_records (
  user_id,
  requirement_id,
  compliance_status,
  tier,
  completion_percentage,
  due_date
)
SELECT 
  p.id as user_id,
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