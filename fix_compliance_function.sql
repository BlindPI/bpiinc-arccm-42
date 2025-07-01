-- FIX COMPLIANCE FUNCTION - COLUMN NAME MISMATCH
-- The function expects 'compliance_status' but table has 'status'

-- =============================================================================
-- FIX: Update get_user_compliance_summary function to use correct column names
-- =============================================================================

CREATE OR REPLACE FUNCTION get_user_compliance_summary(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    overall_score NUMERIC,
    total_metrics INTEGER,
    compliant_count INTEGER,
    warning_count INTEGER,
    non_compliant_count INTEGER,
    pending_count INTEGER,
    overdue_actions INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p_user_id,
        calculate_user_compliance_score(p_user_id),
        COUNT(cm.id)::INTEGER as total_metrics,
        COUNT(CASE WHEN ucr.status = 'compliant' THEN 1 END)::INTEGER as compliant_count,
        COUNT(CASE WHEN ucr.status = 'warning' THEN 1 END)::INTEGER as warning_count,
        COUNT(CASE WHEN ucr.status = 'non_compliant' THEN 1 END)::INTEGER as non_compliant_count,
        COUNT(CASE WHEN ucr.status = 'pending' OR ucr.status IS NULL THEN 1 END)::INTEGER as pending_count,
        (SELECT COUNT(*)::INTEGER FROM public.compliance_actions ca 
         WHERE ca.user_id = p_user_id AND ca.status = 'open' AND ca.due_date < CURRENT_DATE) as overdue_actions
    FROM public.compliance_metrics cm
    LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id AND ucr.user_id = p_user_id
    JOIN public.profiles p ON p.id = p_user_id
    WHERE cm.is_active = true
    AND (cm.required_for_roles = '{}' OR p.role = ANY(cm.required_for_roles));
END;
$$;

-- =============================================================================
-- FIX: Update calculate_user_compliance_score function to use correct column names
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_user_compliance_score(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    total_weight INTEGER := 0;
    weighted_score NUMERIC := 0;
    metric_record RECORD;
BEGIN
    -- Get all applicable metrics for the user's role
    FOR metric_record IN
        SELECT cm.id, cm.weight, ucr.status as compliance_status
        FROM public.compliance_metrics cm
        LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id AND ucr.user_id = p_user_id
        JOIN public.profiles p ON p.id = p_user_id
        WHERE cm.is_active = true
        AND (cm.required_for_roles = '{}' OR p.role = ANY(cm.required_for_roles))
    LOOP
        total_weight := total_weight + metric_record.weight;
        
        CASE metric_record.compliance_status
            WHEN 'compliant' THEN
                weighted_score := weighted_score + (metric_record.weight * 100);
            WHEN 'warning' THEN
                weighted_score := weighted_score + (metric_record.weight * 75);
            WHEN 'non_compliant' THEN
                weighted_score := weighted_score + (metric_record.weight * 0);
            ELSE -- pending or null
                weighted_score := weighted_score + (metric_record.weight * 50);
        END CASE;
    END LOOP;
    
    IF total_weight = 0 THEN
        RETURN 100; -- No applicable metrics
    END IF;
    
    RETURN ROUND(weighted_score / total_weight, 2);
END;
$$;

-- =============================================================================
-- TEST: Verify functions work with correct column names
-- =============================================================================

-- Test the function with the problematic user ID
SELECT 
    'Testing fixed function:' as test_label,
    user_id,
    overall_score,
    total_metrics,
    compliant_count,
    warning_count,
    non_compliant_count,
    pending_count,
    overdue_actions
FROM get_user_compliance_summary('d6700479-c25e-434a-8954-51c716fb140a');

-- Verify data exists
SELECT 
    'Current compliance records:' as check_label,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT metric_id) as unique_metrics
FROM public.user_compliance_records;

-- Check status values
SELECT 
    'Status distribution:' as check_label,
    status,
    COUNT(*) as count
FROM public.user_compliance_records
GROUP BY status;

RAISE NOTICE 'Compliance functions updated to use correct column names (status instead of compliance_status)';