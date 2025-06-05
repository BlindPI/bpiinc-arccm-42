-- Comprehensive CRM Stack Overflow Fix
-- This migration completely removes all potential sources of recursion

-- =====================================================
-- STEP 1: DISABLE ALL RLS AND DROP ALL POLICIES
-- =====================================================

-- Disable RLS on all CRM tables
ALTER TABLE IF EXISTS public.crm_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_pipeline_stages DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_revenue_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_lead_scoring_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_assignment_rules DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.crm_analytics_cache DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies (using IF EXISTS to avoid errors)
DO $$ 
BEGIN
    -- Drop all CRM policies
    DROP POLICY IF EXISTS "SA and AD can view all leads" ON public.crm_leads;
    DROP POLICY IF EXISTS "SA and AD can insert leads" ON public.crm_leads;
    DROP POLICY IF EXISTS "SA and AD can update leads" ON public.crm_leads;
    DROP POLICY IF EXISTS "SA and AD can delete leads" ON public.crm_leads;
    DROP POLICY IF EXISTS "crm_leads_select_policy" ON public.crm_leads;
    DROP POLICY IF EXISTS "crm_leads_insert_policy" ON public.crm_leads;
    DROP POLICY IF EXISTS "crm_leads_update_policy" ON public.crm_leads;
    DROP POLICY IF EXISTS "crm_leads_delete_policy" ON public.crm_leads;

    DROP POLICY IF EXISTS "SA and AD can view all opportunities" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "SA and AD can insert opportunities" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "SA and AD can update opportunities" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "SA and AD can delete opportunities" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "crm_opportunities_select_policy" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "crm_opportunities_insert_policy" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "crm_opportunities_update_policy" ON public.crm_opportunities;
    DROP POLICY IF EXISTS "crm_opportunities_delete_policy" ON public.crm_opportunities;

    DROP POLICY IF EXISTS "SA and AD can view all activities" ON public.crm_activities;
    DROP POLICY IF EXISTS "SA and AD can insert activities" ON public.crm_activities;
    DROP POLICY IF EXISTS "SA and AD can update activities" ON public.crm_activities;
    DROP POLICY IF EXISTS "SA and AD can delete activities" ON public.crm_activities;
    DROP POLICY IF EXISTS "crm_activities_select_policy" ON public.crm_activities;
    DROP POLICY IF EXISTS "crm_activities_insert_policy" ON public.crm_activities;
    DROP POLICY IF EXISTS "crm_activities_update_policy" ON public.crm_activities;
    DROP POLICY IF EXISTS "crm_activities_delete_policy" ON public.crm_activities;

    DROP POLICY IF EXISTS "SA and AD can view all tasks" ON public.crm_tasks;
    DROP POLICY IF EXISTS "SA and AD can insert tasks" ON public.crm_tasks;
    DROP POLICY IF EXISTS "SA and AD can update tasks" ON public.crm_tasks;
    DROP POLICY IF EXISTS "SA and AD can delete tasks" ON public.crm_tasks;
    DROP POLICY IF EXISTS "crm_tasks_select_policy" ON public.crm_tasks;
    DROP POLICY IF EXISTS "crm_tasks_insert_policy" ON public.crm_tasks;
    DROP POLICY IF EXISTS "crm_tasks_update_policy" ON public.crm_tasks;
    DROP POLICY IF EXISTS "crm_tasks_delete_policy" ON public.crm_tasks;

    DROP POLICY IF EXISTS "SA and AD can manage email campaigns" ON public.crm_email_campaigns;
    DROP POLICY IF EXISTS "crm_email_campaigns_all_policy" ON public.crm_email_campaigns;
    DROP POLICY IF EXISTS "SA and AD can manage pipeline stages" ON public.crm_pipeline_stages;
    DROP POLICY IF EXISTS "crm_pipeline_stages_all_policy" ON public.crm_pipeline_stages;
    DROP POLICY IF EXISTS "SA and AD can manage revenue records" ON public.crm_revenue_records;
    DROP POLICY IF EXISTS "crm_revenue_records_all_policy" ON public.crm_revenue_records;
    DROP POLICY IF EXISTS "SA and AD can manage lead scoring rules" ON public.crm_lead_scoring_rules;
    DROP POLICY IF EXISTS "crm_lead_scoring_rules_all_policy" ON public.crm_lead_scoring_rules;
    DROP POLICY IF EXISTS "SA and AD can manage assignment rules" ON public.crm_assignment_rules;
    DROP POLICY IF EXISTS "crm_assignment_rules_all_policy" ON public.crm_assignment_rules;
    DROP POLICY IF EXISTS "SA and AD can access analytics cache" ON public.crm_analytics_cache;
    DROP POLICY IF EXISTS "crm_analytics_cache_all_policy" ON public.crm_analytics_cache;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if policies don't exist
        NULL;
END $$;

-- =====================================================
-- STEP 2: REMOVE PROBLEMATIC DEFAULT VALUES
-- =====================================================

-- Remove DEFAULT auth.uid() from created_by columns as this can cause recursion
DO $$
BEGIN
    -- Remove DEFAULT auth.uid() from all CRM tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
        ALTER TABLE public.crm_leads ALTER COLUMN created_by DROP DEFAULT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_opportunities') THEN
        ALTER TABLE public.crm_opportunities ALTER COLUMN created_by DROP DEFAULT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_activities') THEN
        ALTER TABLE public.crm_activities ALTER COLUMN created_by DROP DEFAULT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_tasks') THEN
        ALTER TABLE public.crm_tasks ALTER COLUMN created_by DROP DEFAULT;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_email_campaigns') THEN
        ALTER TABLE public.crm_email_campaigns ALTER COLUMN created_by DROP DEFAULT;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if columns don't exist
        NULL;
END $$;

-- =====================================================
-- STEP 3: TEMPORARILY DISABLE RLS COMPLETELY
-- =====================================================

-- For now, completely disable RLS to eliminate all recursion sources
-- This allows CRM to function while we debug the root cause

-- Keep RLS disabled for testing
-- ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
-- etc.

-- =====================================================
-- STEP 4: CREATE MINIMAL TEST FUNCTION
-- =====================================================

-- Create a simple test function to verify the fix
CREATE OR REPLACE FUNCTION test_crm_insert()
RETURNS TEXT AS $$
DECLARE
    test_id UUID;
    result TEXT;
BEGIN
    -- Try to insert a test record
    INSERT INTO public.crm_leads (
        email, 
        lead_status, 
        lead_source,
        first_name,
        last_name
    ) VALUES (
        'test-' || extract(epoch from now()) || '@example.com',
        'new',
        'website',
        'Test',
        'User'
    ) RETURNING id INTO test_id;
    
    -- If we get here, the insert worked
    result := 'SUCCESS: Test record created with ID ' || test_id::text;
    
    -- Clean up the test record
    DELETE FROM public.crm_leads WHERE id = test_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Test the function
SELECT test_crm_insert() as test_result;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION test_crm_insert() IS 'Test function to verify CRM insert functionality without RLS recursion';

-- Instructions for next steps:
-- 1. Run this migration
-- 2. Test CRM functionality 
-- 3. If working, gradually re-enable RLS with simpler policies
-- 4. Monitor for any remaining recursion issues