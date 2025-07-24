-- ==========================================
-- CRITICAL FIX: CREATE MISSING COMPLIANCE RECORDS
-- SA users must see ALL 8 requirements for user's tier
-- ==========================================

-- Step 1: Check current state
SELECT 'CURRENT COMPLIANCE METRICS' as info;
SELECT id, name, category, applicable_tiers, is_active 
FROM compliance_metrics 
WHERE is_active = true 
ORDER BY name;

-- Step 2: Check what user compliance records exist for test user
SELECT 'CURRENT USER COMPLIANCE RECORDS' as info;
SELECT 
  ucr.id,
  ucr.user_id,
  ucr.metric_id,
  cm.name as requirement_name,
  cm.category,
  cm.applicable_tiers,
  ucr.status,
  ucr.due_date
FROM user_compliance_records ucr
JOIN compliance_metrics cm ON ucr.metric_id = cm.id
JOIN profiles p ON ucr.user_id = p.id
WHERE p.email LIKE '%test%' OR p.display_name LIKE '%Test%'
ORDER BY cm.name;

-- Step 3: Check user profile info
SELECT 'TEST USER PROFILE' as info;
SELECT id, email, display_name, role, compliance_tier
FROM profiles 
WHERE email LIKE '%test%' OR display_name LIKE '%Test%'
LIMIT 5;

-- Step 4: CREATE MISSING COMPLIANCE RECORDS
-- This will create records for ALL active compliance metrics for users who don't have them

INSERT INTO user_compliance_records (
  user_id,
  metric_id,
  status,
  completion_percentage,
  current_value,
  target_value,
  evidence_files,
  due_date,
  created_at,
  updated_at
)
SELECT DISTINCT
  p.id as user_id,
  cm.id as metric_id,
  'pending' as status,
  0 as completion_percentage,
  '' as current_value,
  cm.target_value,
  '[]' as evidence_files,
  (CURRENT_DATE + INTERVAL '30 days') as due_date,
  NOW() as created_at,
  NOW() as updated_at
FROM profiles p
CROSS JOIN compliance_metrics cm
WHERE 
  -- Only active metrics
  cm.is_active = true
  -- Only for users who need compliance (not SA/AD)
  AND p.role NOT IN ('SA', 'AD')
  -- Only if record doesn't already exist
  AND NOT EXISTS (
    SELECT 1 
    FROM user_compliance_records ucr 
    WHERE ucr.user_id = p.id AND ucr.metric_id = cm.id
  )
  -- Filter by applicable tiers
  AND (
    cm.applicable_tiers IS NULL 
    OR cm.applicable_tiers = '' 
    OR cm.applicable_tiers LIKE '%' || COALESCE(p.compliance_tier, 'basic') || '%'
  );

-- Step 5: Verify the fix
SELECT 'AFTER FIX - COUNT BY USER' as info;
SELECT 
  p.display_name,
  p.email,
  p.role,
  p.compliance_tier,
  COUNT(ucr.id) as total_compliance_records
FROM profiles p
LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id
WHERE p.role NOT IN ('SA', 'AD')
GROUP BY p.id, p.display_name, p.email, p.role, p.compliance_tier
ORDER BY p.display_name;

-- Step 6: Verify test user specifically
SELECT 'TEST USER RECORDS AFTER FIX' as info;
SELECT 
  ucr.id,
  cm.name as requirement_name,
  cm.category,
  cm.applicable_tiers,
  ucr.status,
  ucr.due_date
FROM user_compliance_records ucr
JOIN compliance_metrics cm ON ucr.metric_id = cm.id
JOIN profiles p ON ucr.user_id = p.id
WHERE (p.email LIKE '%test%' OR p.display_name LIKE '%Test%')
ORDER BY cm.name;