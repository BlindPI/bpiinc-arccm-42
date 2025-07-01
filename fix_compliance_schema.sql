-- COMPLIANCE SCHEMA FIX
-- This fixes the missing metric_id column issue

-- =============================================================================
-- FIX 1: Add the missing metric_id column to user_compliance_records
-- =============================================================================

-- First, check if the column exists to avoid errors
DO $$
BEGIN
    -- Add metric_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_compliance_records' 
        AND column_name = 'metric_id'
    ) THEN
        ALTER TABLE public.user_compliance_records 
        ADD COLUMN metric_id UUID NOT NULL DEFAULT gen_random_uuid();
        
        -- Add foreign key constraint
        ALTER TABLE public.user_compliance_records 
        ADD CONSTRAINT fk_user_compliance_records_metric_id 
        FOREIGN KEY (metric_id) REFERENCES public.compliance_metrics(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Added missing metric_id column to user_compliance_records';
    ELSE
        RAISE NOTICE 'metric_id column already exists in user_compliance_records';
    END IF;
END $$;

-- =============================================================================
-- FIX 2: Ensure unique constraint exists
-- =============================================================================

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'user_compliance_records' 
        AND constraint_name = 'user_compliance_records_user_id_metric_id_key'
    ) THEN
        ALTER TABLE public.user_compliance_records 
        ADD CONSTRAINT user_compliance_records_user_id_metric_id_key 
        UNIQUE(user_id, metric_id);
        
        RAISE NOTICE 'Added unique constraint for user_id, metric_id';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- =============================================================================
-- FIX 3: Re-create the get_user_compliance_summary function to ensure it's correct
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
-- FIX 4: Test the function after the fix
-- =============================================================================

-- Test with a sample user ID (replace with actual user ID from your system)
-- SELECT * FROM get_user_compliance_summary('d6700479-c25e-434a-8954-51c716fb140a');

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify the table structure is correct
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_compliance_records'
ORDER BY ordinal_position;

RAISE NOTICE 'Compliance schema fix completed. Please test the get_user_compliance_summary function.';