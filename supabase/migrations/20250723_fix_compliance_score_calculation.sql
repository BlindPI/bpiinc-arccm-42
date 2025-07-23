-- Fix Compliance Score Calculation Bug
-- The calculate_user_compliance_score function was giving 50% credit for pending/null compliance
-- This caused users with no compliance to show 23% instead of 0%

-- =============================================================================
-- CRITICAL FIX: Compliance Score Calculation
-- =============================================================================

-- Drop dependent view first, then the function
DROP VIEW IF EXISTS compliance_dashboard_summary CASCADE;
DROP FUNCTION IF EXISTS calculate_user_compliance_score(UUID) CASCADE;

-- Recreate with corrected logic: pending/null should be 0%, not 50%
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
        SELECT cm.id, cm.weight, ucr.compliance_status
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
            ELSE -- CRITICAL FIX: pending or null should be 0%, not 50%
                weighted_score := weighted_score + (metric_record.weight * 0);
        END CASE;
    END LOOP;
    
    -- CRITICAL FIX: Return 0 when no applicable metrics, not 100
    IF total_weight = 0 THEN
        RETURN 0; -- No applicable metrics means 0% compliance, not 100%
    END IF;
    
    RETURN ROUND(weighted_score / total_weight, 2);
END;
$$;

-- Also update the get_user_compliance_summary function to use the corrected calculation
DROP FUNCTION IF EXISTS get_user_compliance_summary(UUID);

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
        calculate_user_compliance_score(p_user_id), -- Now uses corrected calculation
        COUNT(cm.id)::INTEGER as total_metrics,
        COUNT(CASE WHEN ucr.compliance_status = 'compliant' THEN 1 END)::INTEGER as compliant_count,
        COUNT(CASE WHEN ucr.compliance_status = 'warning' THEN 1 END)::INTEGER as warning_count,
        COUNT(CASE WHEN ucr.compliance_status = 'non_compliant' THEN 1 END)::INTEGER as non_compliant_count,
        COUNT(CASE WHEN ucr.compliance_status = 'pending' OR ucr.compliance_status IS NULL THEN 1 END)::INTEGER as pending_count,
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
-- ADDITIONAL FIX: Create or Update compliance_dashboard_summary View
-- =============================================================================

-- Create a view that properly calculates compliance scores
DROP VIEW IF EXISTS compliance_dashboard_summary;

CREATE VIEW compliance_dashboard_summary AS
SELECT 
    p.id as user_id,
    p.display_name,
    p.email,
    p.role,
    p.compliance_tier,
    COALESCE(summary.overall_score, 0) as compliance_score,
    COALESCE(summary.total_metrics, 0) as total_requirements,
    COALESCE(summary.compliant_count, 0) as compliant_count,
    COALESCE(summary.warning_count, 0) as warning_count,
    COALESCE(summary.non_compliant_count, 0) as non_compliant_count,
    COALESCE(summary.pending_count, 0) as pending_count,
    COALESCE(summary.overdue_actions, 0) as overdue_count,
    GREATEST(p.updated_at, COALESCE(MAX(ucr.updated_at), p.updated_at)) as last_activity
FROM profiles p
LEFT JOIN LATERAL get_user_compliance_summary(p.id) summary ON true
LEFT JOIN user_compliance_records ucr ON ucr.user_id = p.id
GROUP BY 
    p.id, p.display_name, p.email, p.role, p.compliance_tier, p.updated_at,
    summary.overall_score, summary.total_metrics, summary.compliant_count,
    summary.warning_count, summary.non_compliant_count, summary.pending_count,
    summary.overdue_actions;

-- Grant permissions
GRANT SELECT ON compliance_dashboard_summary TO authenticated;

COMMENT ON VIEW compliance_dashboard_summary IS 'Compliance dashboard summary with corrected score calculation (0% for no compliance instead of 23%)';

RAISE NOTICE 'COMPLIANCE SCORE BUG FIXED!';
RAISE NOTICE 'Fixed calculate_user_compliance_score: pending/null now gives 0%% instead of 50%%';
RAISE NOTICE 'Fixed get_user_compliance_summary: uses corrected calculation';
RAISE NOTICE 'Created compliance_dashboard_summary view with proper calculations';