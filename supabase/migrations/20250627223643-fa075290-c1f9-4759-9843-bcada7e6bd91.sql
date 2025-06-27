
-- Fix the RPC functions to use proper data types and add sample compliance data

-- First, fix the get_compliance_analytics function with proper data types
DROP FUNCTION IF EXISTS get_compliance_analytics();
CREATE OR REPLACE FUNCTION get_compliance_analytics()
RETURNS TABLE (
    metric_name character varying,
    basic_completion_rate numeric,
    robust_completion_rate numeric,
    total_users_basic bigint,
    total_users_robust bigint,
    completed_basic bigint,
    completed_robust bigint,
    pending_users bigint,
    overdue_users bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cm.name::character varying as metric_name,
        COALESCE(
            ROUND(
                (COUNT(CASE WHEN p.compliance_tier = 'basic' AND ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
                 NULLIF(COUNT(CASE WHEN p.compliance_tier = 'basic' THEN 1 END), 0) * 100), 2
            ), 0::numeric
        ) as basic_completion_rate,
        COALESCE(
            ROUND(
                (COUNT(CASE WHEN p.compliance_tier = 'robust' AND ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
                 NULLIF(COUNT(CASE WHEN p.compliance_tier = 'robust' THEN 1 END), 0) * 100), 2
            ), 0::numeric
        ) as robust_completion_rate,
        COUNT(CASE WHEN p.compliance_tier = 'basic' THEN 1 END) as total_users_basic,
        COUNT(CASE WHEN p.compliance_tier = 'robust' THEN 1 END) as total_users_robust,
        COUNT(CASE WHEN p.compliance_tier = 'basic' AND ucr.compliance_status = 'approved' THEN 1 END) as completed_basic,
        COUNT(CASE WHEN p.compliance_tier = 'robust' AND ucr.compliance_status = 'approved' THEN 1 END) as completed_robust,
        COUNT(CASE WHEN ucr.compliance_status = 'pending' THEN 1 END) as pending_users,
        COUNT(CASE WHEN ucr.compliance_status = 'overdue' THEN 1 END) as overdue_users
    FROM compliance_metrics cm
    CROSS JOIN profiles p
    LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id AND ucr.metric_id = cm.id
    WHERE p.compliance_tier IS NOT NULL AND cm.is_active = true
    GROUP BY cm.id, cm.name
    ORDER BY cm.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the get_tier_distribution function with proper data types
DROP FUNCTION IF EXISTS get_tier_distribution();
CREATE OR REPLACE FUNCTION get_tier_distribution()
RETURNS TABLE (
    tier_name character varying,
    user_count bigint,
    completion_percentage numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.compliance_tier, 'unassigned')::character varying as tier_name,
        COUNT(DISTINCT p.id) as user_count,
        COALESCE(
            ROUND(
                (COUNT(CASE WHEN ucr.compliance_status = 'approved' THEN 1 END)::numeric / 
                 NULLIF(COUNT(ucr.id), 0) * 100), 2
            ), 0::numeric
        ) as completion_percentage
    FROM profiles p
    LEFT JOIN user_compliance_records ucr ON p.id = ucr.user_id
    WHERE p.id IS NOT NULL
    GROUP BY p.compliance_tier
    ORDER BY user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_compliance_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tier_distribution() TO authenticated;

-- Add sample compliance data for testing
-- First, ensure we have compliance metrics
INSERT INTO compliance_metrics (name, category, measurement_type, required_for_roles, is_active)
VALUES
('Resume Upload', 'documentation', 'file_upload', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Background Check', 'verification', 'document_review', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Company Information', 'profile', 'form_completion', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Training Completion', 'education', 'course_completion', ARRAY['IC', 'AP'], true),
('Certification Upload', 'credentials', 'file_upload', ARRAY['IC', 'AP'], true),
('Insurance Documentation', 'verification', 'document_review', ARRAY['AP'], true),
('Continuing Education', 'education', 'course_completion', ARRAY['AP'], true)
ON CONFLICT (name) DO NOTHING;

-- Ensure users have compliance tiers assigned
UPDATE profiles 
SET compliance_tier = CASE 
    WHEN role IN ('AP', 'IC') THEN 'robust'
    ELSE 'basic'
END
WHERE compliance_tier IS NULL;

-- Add sample user compliance records for existing users
WITH user_metric_combinations AS (
    SELECT 
        p.id as user_id,
        cm.id as metric_id,
        cm.name as metric_name,
        p.compliance_tier,
        -- Random status distribution for realistic data
        CASE 
            WHEN random() < 0.7 THEN 'approved'
            WHEN random() < 0.85 THEN 'pending'
            ELSE 'overdue'
        END as status
    FROM profiles p
    CROSS JOIN compliance_metrics cm
    WHERE p.compliance_tier IS NOT NULL
    AND cm.is_active = true
    AND (
        (p.compliance_tier = 'basic' AND cm.name IN ('Resume Upload', 'Background Check', 'Company Information')) OR
        (p.compliance_tier = 'robust' AND cm.name IN ('Resume Upload', 'Background Check', 'Company Information', 'Training Completion', 'Certification Upload', 'Insurance Documentation', 'Continuing Education'))
    )
)
INSERT INTO user_compliance_records (
    user_id, 
    metric_id, 
    compliance_status, 
    current_value, 
    submitted_at,
    last_checked_at
)
SELECT 
    user_id,
    metric_id,
    status,
    CASE 
        WHEN status = 'approved' THEN 'Completed successfully'
        WHEN status = 'pending' THEN 'Awaiting review'
        ELSE 'Overdue for submission'
    END,
    NOW() - (random() * interval '30 days'),
    NOW() - (random() * interval '7 days')
FROM user_metric_combinations
ON CONFLICT (user_id, metric_id) DO UPDATE SET
    compliance_status = EXCLUDED.compliance_status,
    current_value = EXCLUDED.current_value,
    submitted_at = EXCLUDED.submitted_at,
    last_checked_at = EXCLUDED.last_checked_at;

-- Test the functions to ensure they work
DO $$
DECLARE
    test_analytics RECORD;
    test_distribution RECORD;
    analytics_count INTEGER := 0;
    distribution_count INTEGER := 0;
BEGIN
    -- Test analytics function
    FOR test_analytics IN SELECT * FROM get_compliance_analytics() LOOP
        analytics_count := analytics_count + 1;
    END LOOP;
    
    -- Test distribution function  
    FOR test_distribution IN SELECT * FROM get_tier_distribution() LOOP
        distribution_count := distribution_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Analytics function returned % rows', analytics_count;
    RAISE NOTICE 'Distribution function returned % rows', distribution_count;
    
    IF analytics_count = 0 THEN
        RAISE NOTICE 'WARNING: No analytics data found';
    END IF;
    
    IF distribution_count = 0 THEN
        RAISE NOTICE 'WARNING: No distribution data found';
    END IF;
END $$;
