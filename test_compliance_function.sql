-- TEST COMPLIANCE FUNCTION AFTER FIX
-- Verify that get_user_compliance_summary now works correctly

-- =============================================================================
-- TEST 1: Test the function with the problematic user ID from the error logs
-- =============================================================================

SELECT 'Testing get_user_compliance_summary function...' as test_step;

-- Test with the user ID that was failing: d6700479-c25e-434a-8954-51c716fb140a
SELECT 
    user_id,
    overall_score,
    total_metrics,
    compliant_count,
    warning_count,
    non_compliant_count,
    pending_count,
    overdue_actions
FROM get_user_compliance_summary('d6700479-c25e-434a-8954-51c716fb140a');

-- =============================================================================
-- TEST 2: Verify the tables are properly linked
-- =============================================================================

SELECT 'Testing table relationships...' as test_step;

-- Check if compliance_metrics exist
SELECT 
    COUNT(*) as total_compliance_metrics,
    COUNT(CASE WHEN is_active THEN 1 END) as active_metrics
FROM public.compliance_metrics;

-- Check if user_compliance_records can join properly
SELECT 
    cm.name as metric_name,
    ucr.metric_id,
    ucr.user_id,
    ucr.status as compliance_status
FROM public.compliance_metrics cm
LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id
WHERE cm.is_active = true
LIMIT 10;

-- =============================================================================
-- TEST 3: Check if there's data mismatch between tables
-- =============================================================================

SELECT 'Checking for data consistency...' as test_step;

-- Are there compliance records without corresponding metrics?
SELECT 
    COUNT(*) as orphaned_compliance_records
FROM public.user_compliance_records ucr
LEFT JOIN public.compliance_metrics cm ON ucr.metric_id = cm.id
WHERE cm.id IS NULL;

-- Are there users in the system?
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role IN ('AP', 'IN', 'SA', 'AD') THEN 1 END) as role_users
FROM public.profiles
WHERE id IN (
    SELECT DISTINCT user_id 
    FROM public.user_compliance_records 
    WHERE user_id IS NOT NULL
);

-- =============================================================================
-- TEST 4: Verify the calculate_user_compliance_score function works
-- =============================================================================

SELECT 'Testing compliance score calculation...' as test_step;

SELECT 
    'Test User Score:' as label,
    calculate_user_compliance_score('d6700479-c25e-434a-8954-51c716fb140a') as score;

-- =============================================================================
-- FINAL STATUS CHECK
-- =============================================================================

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM get_user_compliance_summary('d6700479-c25e-434a-8954-51c716fb140a')
        ) THEN 'SUCCESS: get_user_compliance_summary function is now working'
        ELSE 'ERROR: Function still failing'
    END as final_status;