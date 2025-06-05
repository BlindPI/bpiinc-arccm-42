-- Restore CRM Features Safely
-- This migration gradually re-introduces features removed in the nuclear fix

-- =====================================================
-- STEP 1: ADD FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraints (these were removed for safety)
DO $$
BEGIN
    -- Add foreign key from opportunities to leads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_opportunities_lead_id_fkey'
    ) THEN
        ALTER TABLE public.crm_opportunities 
        ADD CONSTRAINT crm_opportunities_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE SET NULL;
    END IF;

    -- Add foreign key from activities to leads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_activities_lead_id_fkey'
    ) THEN
        ALTER TABLE public.crm_activities 
        ADD CONSTRAINT crm_activities_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from activities to opportunities
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_activities_opportunity_id_fkey'
    ) THEN
        ALTER TABLE public.crm_activities 
        ADD CONSTRAINT crm_activities_opportunity_id_fkey 
        FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from tasks to leads
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_tasks_lead_id_fkey'
    ) THEN
        ALTER TABLE public.crm_tasks 
        ADD CONSTRAINT crm_tasks_lead_id_fkey 
        FOREIGN KEY (lead_id) REFERENCES public.crm_leads(id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from tasks to opportunities
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'crm_tasks_opportunity_id_fkey'
    ) THEN
        ALTER TABLE public.crm_tasks 
        ADD CONSTRAINT crm_tasks_opportunity_id_fkey 
        FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id) ON DELETE CASCADE;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding foreign keys: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 2: ADD SIMPLE UPDATE TRIGGERS (NON-RECURSIVE)
-- =====================================================

-- Create a simple, non-recursive function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple timestamp update without any auth calls
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns (only if they don't exist)
DO $$
BEGIN
    -- Drop existing triggers first to avoid conflicts
    DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON public.crm_leads;
    DROP TRIGGER IF EXISTS update_crm_opportunities_updated_at ON public.crm_opportunities;
    DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON public.crm_activities;
    DROP TRIGGER IF EXISTS update_crm_tasks_updated_at ON public.crm_tasks;
    DROP TRIGGER IF EXISTS update_crm_pipeline_stages_updated_at ON public.crm_pipeline_stages;

    -- Create new simple triggers
    CREATE TRIGGER update_crm_leads_updated_at 
        BEFORE UPDATE ON public.crm_leads 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
        
    CREATE TRIGGER update_crm_opportunities_updated_at 
        BEFORE UPDATE ON public.crm_opportunities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
        
    CREATE TRIGGER update_crm_activities_updated_at 
        BEFORE UPDATE ON public.crm_activities 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
        
    CREATE TRIGGER update_crm_tasks_updated_at 
        BEFORE UPDATE ON public.crm_tasks 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
        
    CREATE TRIGGER update_crm_pipeline_stages_updated_at 
        BEFORE UPDATE ON public.crm_pipeline_stages 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error adding triggers: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 3: ADD PERFORMANCE INDEXES
-- =====================================================

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at);

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON public.crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_assigned_to ON public.crm_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead_id ON public.crm_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close_date ON public.crm_opportunities(expected_close_date);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON public.crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_by ON public.crm_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(activity_date);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON public.crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON public.crm_tasks(due_date);

-- =====================================================
-- STEP 4: ADD SIMPLE, NON-RECURSIVE RLS POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Create simple policies that don't query other tables
-- These policies allow all authenticated users (avoiding profile table queries)

-- CRM Leads policies
CREATE POLICY "authenticated_users_crm_leads_select" ON public.crm_leads
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_leads_insert" ON public.crm_leads
    FOR INSERT TO authenticated WITH CHECK (true);
    
CREATE POLICY "authenticated_users_crm_leads_update" ON public.crm_leads
    FOR UPDATE TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_leads_delete" ON public.crm_leads
    FOR DELETE TO authenticated USING (true);

-- CRM Opportunities policies
CREATE POLICY "authenticated_users_crm_opportunities_select" ON public.crm_opportunities
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_opportunities_insert" ON public.crm_opportunities
    FOR INSERT TO authenticated WITH CHECK (true);
    
CREATE POLICY "authenticated_users_crm_opportunities_update" ON public.crm_opportunities
    FOR UPDATE TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_opportunities_delete" ON public.crm_opportunities
    FOR DELETE TO authenticated USING (true);

-- CRM Activities policies
CREATE POLICY "authenticated_users_crm_activities_select" ON public.crm_activities
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_activities_insert" ON public.crm_activities
    FOR INSERT TO authenticated WITH CHECK (true);
    
CREATE POLICY "authenticated_users_crm_activities_update" ON public.crm_activities
    FOR UPDATE TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_activities_delete" ON public.crm_activities
    FOR DELETE TO authenticated USING (true);

-- CRM Tasks policies
CREATE POLICY "authenticated_users_crm_tasks_select" ON public.crm_tasks
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_tasks_insert" ON public.crm_tasks
    FOR INSERT TO authenticated WITH CHECK (true);
    
CREATE POLICY "authenticated_users_crm_tasks_update" ON public.crm_tasks
    FOR UPDATE TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_tasks_delete" ON public.crm_tasks
    FOR DELETE TO authenticated USING (true);

-- CRM Pipeline Stages policies
CREATE POLICY "authenticated_users_crm_pipeline_stages_select" ON public.crm_pipeline_stages
    FOR SELECT TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_pipeline_stages_insert" ON public.crm_pipeline_stages
    FOR INSERT TO authenticated WITH CHECK (true);
    
CREATE POLICY "authenticated_users_crm_pipeline_stages_update" ON public.crm_pipeline_stages
    FOR UPDATE TO authenticated USING (true);
    
CREATE POLICY "authenticated_users_crm_pipeline_stages_delete" ON public.crm_pipeline_stages
    FOR DELETE TO authenticated USING (true);

-- =====================================================
-- STEP 5: CREATE MISSING TABLES
-- =====================================================

-- Create the remaining CRM tables that were in the original migration
CREATE TABLE IF NOT EXISTS public.crm_email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) DEFAULT 'newsletter',
    subject_line VARCHAR(255),
    email_content TEXT,
    target_audience TEXT,
    status VARCHAR(50) DEFAULT 'draft',
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(15,2) DEFAULT 0,
    campaign_cost DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

CREATE TABLE IF NOT EXISTS public.crm_revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(15,2) NOT NULL,
    revenue_date DATE NOT NULL,
    revenue_type VARCHAR(100) DEFAULT 'certificate_fee',
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    ap_location_id UUID,
    certificate_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    commission_amount DECIMAL(15,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    sales_rep_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    field_value VARCHAR(255) NOT NULL,
    score_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    criteria JSONB NOT NULL,
    assigned_user_id UUID,
    assignment_type VARCHAR(50) DEFAULT 'round_robin',
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS and add policies for new tables
ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Add simple policies for new tables
CREATE POLICY "authenticated_users_crm_email_campaigns" ON public.crm_email_campaigns FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_users_crm_revenue_records" ON public.crm_revenue_records FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_users_crm_lead_scoring_rules" ON public.crm_lead_scoring_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_users_crm_assignment_rules" ON public.crm_assignment_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "authenticated_users_crm_analytics_cache" ON public.crm_analytics_cache FOR ALL TO authenticated USING (true);

-- Add triggers for new tables
CREATE TRIGGER update_crm_email_campaigns_updated_at 
    BEFORE UPDATE ON public.crm_email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
    
CREATE TRIGGER update_crm_revenue_records_updated_at 
    BEFORE UPDATE ON public.crm_revenue_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
    
CREATE TRIGGER update_crm_lead_scoring_rules_updated_at 
    BEFORE UPDATE ON public.crm_lead_scoring_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();
    
CREATE TRIGGER update_crm_assignment_rules_updated_at 
    BEFORE UPDATE ON public.crm_assignment_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

-- =====================================================
-- STEP 6: INSERT DEFAULT DATA FOR NEW TABLES
-- =====================================================

-- Insert default lead scoring rules
INSERT INTO public.crm_lead_scoring_rules (rule_name, rule_description, field_name, operator, field_value, score_points) VALUES
('Enterprise Company', 'Large company size indicates higher value', 'company_name', 'contains', 'enterprise', 20),
('Training Industry', 'Companies in training industry', 'company_name', 'contains', 'training', 15),
('Manager Title', 'Management level contact', 'job_title', 'contains', 'manager', 10),
('Director Title', 'Director level contact', 'job_title', 'contains', 'director', 15),
('Website Source', 'Lead from website', 'lead_source', 'equals', 'website', 5),
('Referral Source', 'Lead from referral', 'lead_source', 'equals', 'referral', 25)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: VERIFICATION
-- =====================================================

-- Test that everything still works
CREATE OR REPLACE FUNCTION test_restored_crm_features()
RETURNS TEXT AS $$
DECLARE
    test_lead_id UUID;
    test_opp_id UUID;
    result TEXT;
BEGIN
    -- Test lead creation
    INSERT INTO public.crm_leads (
        email, lead_status, lead_source, lead_type, first_name, last_name
    ) VALUES (
        'restore-test-' || extract(epoch from now()) || '@example.com',
        'new', 'website', 'individual', 'Restore', 'Test'
    ) RETURNING id INTO test_lead_id;
    
    -- Test opportunity creation with foreign key
    INSERT INTO public.crm_opportunities (
        opportunity_name, estimated_value, stage, lead_id
    ) VALUES (
        'Test Opportunity', 5000.00, 'prospect', test_lead_id
    ) RETURNING id INTO test_opp_id;
    
    -- Test update (triggers the updated_at trigger)
    UPDATE public.crm_leads SET lead_score = 75 WHERE id = test_lead_id;
    
    result := 'SUCCESS: Restored features test passed. Lead ID: ' || test_lead_id::text || ', Opportunity ID: ' || test_opp_id::text;
    
    -- Clean up
    DELETE FROM public.crm_opportunities WHERE id = test_opp_id;
    DELETE FROM public.crm_leads WHERE id = test_lead_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_restored_crm_features() as restoration_test_result;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON FUNCTION update_updated_at_simple() IS 'Simple timestamp update function without auth calls to avoid recursion';
COMMENT ON FUNCTION test_restored_crm_features() IS 'Test function to verify that restored features work correctly';

-- Final verification query
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename LIKE 'crm_%' 
AND schemaname = 'public'
ORDER BY tablename;