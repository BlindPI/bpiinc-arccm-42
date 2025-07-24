-- COMPLETE COMPLIANCE DATA ANALYSIS SQL
-- Run this to get all the data I need to understand the role/tier filtering issue

-- 1. All compliance metrics with their role and tier assignments
SELECT 
    'COMPLIANCE_METRICS' as table_name,
    id,
    name,
    category,
    required_for_roles,
    applicable_tiers,
    measurement_type,
    is_active
FROM compliance_metrics
ORDER BY name;

-- 2. All user profiles with their roles and compliance tiers
SELECT 
    'USER_PROFILES' as table_name,
    id,
    display_name,
    email,
    role,
    compliance_tier
FROM profiles
WHERE role IN ('AP', 'IC', 'IP', 'IT', 'SA', 'AD')
ORDER BY role, display_name;

-- 3. Sample of user compliance records to see the relationship
SELECT 
    'USER_COMPLIANCE_RECORDS' as table_name,
    ucr.user_id,
    p.display_name,
    p.role as user_role,
    p.compliance_tier as user_tier,
    ucr.metric_id,
    cm.name as metric_name,
    cm.required_for_roles as metric_roles,
    cm.applicable_tiers as metric_tiers,
    ucr.compliance_status
FROM user_compliance_records ucr
JOIN profiles p ON ucr.user_id = p.id
JOIN compliance_metrics cm ON ucr.metric_id = cm.id
WHERE p.role IN ('AP', 'IC', 'IP', 'IT')
ORDER BY p.role, p.display_name, cm.name
LIMIT 50;

-- 4. Count of metrics by role requirements
SELECT 
    'METRICS_BY_ROLE' as table_name,
    required_for_roles,
    applicable_tiers,
    COUNT(*) as metric_count,
    STRING_AGG(name, ', ') as metric_names
FROM compliance_metrics
WHERE is_active = true
GROUP BY required_for_roles, applicable_tiers
ORDER BY metric_count DESC;

-- 5. User compliance summary by role
SELECT 
    'USER_SUMMARY_BY_ROLE' as table_name,
    p.role,
    p.compliance_tier,
    COUNT(DISTINCT p.id) as user_count,
    COUNT(ucr.id) as total_compliance_records,
    COUNT(CASE WHEN ucr.compliance_status = 'compliant' THEN 1 END) as compliant_records
FROM profiles p
LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id
WHERE p.role IN ('AP', 'IC', 'IP', 'IT')
GROUP BY p.role, p.compliance_tier
ORDER BY p.role, p.compliance_tier;