-- COMPLIANCE SYSTEM DIAGNOSTIC CHECKS
-- Run these queries to identify the database schema issues

-- =============================================================================
-- CHECK 1: Verify if compliance tables exist
-- =============================================================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'compliance_metrics', 
    'user_compliance_records', 
    'compliance_actions', 
    'compliance_audit_log'
);

-- =============================================================================
-- CHECK 2: Verify user_compliance_records table structure
-- =============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_compliance_records'
ORDER BY ordinal_position;

-- =============================================================================
-- CHECK 3: Verify compliance_metrics table structure  
-- =============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'compliance_metrics'
ORDER BY ordinal_position;

-- =============================================================================
-- CHECK 4: Check if get_user_compliance_summary function exists
-- =============================================================================
SELECT 
    routine_name,
    routine_type,
    specific_name,
    created
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'get_user_compliance_summary';

-- =============================================================================
-- CHECK 5: Get the actual function definition
-- =============================================================================
SELECT 
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'get_user_compliance_summary';

-- =============================================================================
-- CHECK 6: Verify foreign key relationships
-- =============================================================================
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('user_compliance_records', 'compliance_metrics')
AND tc.table_schema = 'public';

-- =============================================================================
-- CHECK 7: Test a simple query that's failing
-- =============================================================================
-- This should reveal the exact error:
SELECT 
    cm.id as metric_id,
    ucr.metric_id as record_metric_id,
    cm.name,
    ucr.compliance_status
FROM public.compliance_metrics cm
LEFT JOIN public.user_compliance_records ucr ON cm.id = ucr.metric_id
WHERE cm.is_active = true
LIMIT 5;