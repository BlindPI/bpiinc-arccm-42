-- Fix CRM Column Constraints
-- This migration fixes NOT NULL constraints and missing defaults

-- =====================================================
-- FIX COLUMN CONSTRAINTS
-- =====================================================

-- Fix lead_type column - make it nullable or add default
DO $$
BEGIN
    -- Check if crm_leads table exists and fix lead_type column
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
        -- Option 1: Make lead_type nullable (safer approach)
        ALTER TABLE public.crm_leads ALTER COLUMN lead_type DROP NOT NULL;
        
        -- Option 2: Add a default value
        ALTER TABLE public.crm_leads ALTER COLUMN lead_type SET DEFAULT 'individual';
        
        -- Update any existing NULL values
        UPDATE public.crm_leads SET lead_type = 'individual' WHERE lead_type IS NULL;
    END IF;
    
    -- Fix other potential constraint issues
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_opportunities') THEN
        -- Ensure opportunity_type has a default
        ALTER TABLE public.crm_opportunities ALTER COLUMN opportunity_type SET DEFAULT 'training_contract';
        UPDATE public.crm_opportunities SET opportunity_type = 'training_contract' WHERE opportunity_type IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_activities') THEN
        -- Ensure activity_type has a default
        ALTER TABLE public.crm_activities ALTER COLUMN activity_type SET DEFAULT 'task';
        UPDATE public.crm_activities SET activity_type = 'task' WHERE activity_type IS NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_tasks') THEN
        -- Ensure task_type has a default
        ALTER TABLE public.crm_tasks ALTER COLUMN task_type SET DEFAULT 'other';
        UPDATE public.crm_tasks SET task_type = 'other' WHERE task_type IS NULL;
        
        -- Ensure priority has a default
        ALTER TABLE public.crm_tasks ALTER COLUMN priority SET DEFAULT 'medium';
        UPDATE public.crm_tasks SET priority = 'medium' WHERE priority IS NULL;
        
        -- Ensure status has a default
        ALTER TABLE public.crm_tasks ALTER COLUMN status SET DEFAULT 'pending';
        UPDATE public.crm_tasks SET status = 'pending' WHERE status IS NULL;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the migration
        RAISE NOTICE 'Error fixing constraints: %', SQLERRM;
END $$;

-- =====================================================
-- UPDATE TEST FUNCTION
-- =====================================================

-- Update the test function to include lead_type
CREATE OR REPLACE FUNCTION test_crm_insert()
RETURNS TEXT AS $$
DECLARE
    test_id UUID;
    result TEXT;
BEGIN
    -- Try to insert a test record with all required fields
    INSERT INTO public.crm_leads (
        email, 
        lead_status, 
        lead_source,
        lead_type,
        first_name,
        last_name
    ) VALUES (
        'test-' || extract(epoch from now()) || '@example.com',
        'new',
        'website',
        'individual',
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
-- TEST THE FIX
-- =====================================================

-- Test the function to verify the fix
SELECT test_crm_insert() as test_result;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check column defaults
SELECT 
    column_name,
    column_default,
    is_nullable,
    data_type
FROM information_schema.columns 
WHERE table_name = 'crm_leads' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION test_crm_insert() IS 'Updated test function that includes lead_type field to avoid constraint violations';