-- CRM Tables Creation and RLS Policies
-- This migration creates all required CRM tables with proper RLS policies for SA and AD users

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CRM LEADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    job_title VARCHAR(255),
    lead_status VARCHAR(50) DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
    lead_source VARCHAR(50) DEFAULT 'website' CHECK (lead_source IN ('website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other')),
    lead_score INTEGER DEFAULT 0,
    lead_type VARCHAR(50) DEFAULT 'individual',
    assigned_to UUID REFERENCES auth.users(id),
    qualification_notes TEXT,
    last_contact_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on crm_leads
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_leads
CREATE POLICY "SA and AD can view all leads"
ON public.crm_leads FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
);

CREATE POLICY "SA and AD can insert leads"
ON public.crm_leads FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "SA and AD can update leads"
ON public.crm_leads FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
);

CREATE POLICY "SA and AD can delete leads"
ON public.crm_leads FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM OPPORTUNITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_name VARCHAR(255) NOT NULL,
    estimated_value DECIMAL(15,2) DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'prospect' CHECK (stage IN ('prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES auth.users(id),
    next_steps TEXT,
    opportunity_type VARCHAR(100) DEFAULT 'training_contract',
    opportunity_status VARCHAR(50) DEFAULT 'open',
    close_date DATE,
    pipeline_stage_id UUID,
    preferred_ap_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on crm_opportunities
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_opportunities
CREATE POLICY "SA and AD can view all opportunities"
ON public.crm_opportunities FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
);

CREATE POLICY "SA and AD can insert opportunities"
ON public.crm_opportunities FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "SA and AD can update opportunities"
ON public.crm_opportunities FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
);

CREATE POLICY "SA and AD can delete opportunities"
ON public.crm_opportunities FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_type VARCHAR(50) DEFAULT 'task' CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note', 'phone')),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
    outcome VARCHAR(50) DEFAULT 'pending' CHECK (outcome IN ('pending', 'completed', 'cancelled')),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_activities
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_activities
CREATE POLICY "SA and AD can view all activities"
ON public.crm_activities FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR created_by = auth.uid()
);

CREATE POLICY "SA and AD can insert activities"
ON public.crm_activities FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "SA and AD can update activities"
ON public.crm_activities FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR created_by = auth.uid()
);

CREATE POLICY "SA and AD can delete activities"
ON public.crm_activities FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR created_by = auth.uid()
);

-- =====================================================
-- CRM TASKS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_title VARCHAR(255) NOT NULL,
    task_description TEXT,
    task_type VARCHAR(50) DEFAULT 'other' CHECK (task_type IN ('call', 'email', 'meeting', 'follow_up', 'demo', 'proposal', 'contract', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id),
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on crm_tasks
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_tasks
CREATE POLICY "SA and AD can view all tasks"
ON public.crm_tasks FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
);

CREATE POLICY "SA and AD can insert tasks"
ON public.crm_tasks FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "SA and AD can update tasks"
ON public.crm_tasks FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR assigned_to = auth.uid()
    OR created_by = auth.uid()
);

CREATE POLICY "SA and AD can delete tasks"
ON public.crm_tasks FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR created_by = auth.uid()
);

-- =====================================================
-- CRM EMAIL CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) DEFAULT 'newsletter',
    subject_line VARCHAR(255),
    email_content TEXT,
    target_audience TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent', 'cancelled')),
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
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Enable RLS on crm_email_campaigns
ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_email_campaigns
CREATE POLICY "SA and AD can manage email campaigns"
ON public.crm_email_campaigns FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM PIPELINE STAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name VARCHAR(100) NOT NULL,
    stage_description TEXT,
    stage_order INTEGER NOT NULL,
    stage_probability INTEGER DEFAULT 50 CHECK (stage_probability >= 0 AND stage_probability <= 100),
    is_active BOOLEAN DEFAULT true,
    stage_color VARCHAR(7) DEFAULT '#3B82F6',
    required_fields TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_pipeline_stages
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_pipeline_stages
CREATE POLICY "SA and AD can manage pipeline stages"
ON public.crm_pipeline_stages FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM REVENUE RECORDS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_revenue_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(15,2) NOT NULL,
    revenue_date DATE NOT NULL,
    revenue_type VARCHAR(100) DEFAULT 'certificate_fee',
    opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
    ap_location_id UUID,
    certificate_count INTEGER DEFAULT 0,
    participant_count INTEGER DEFAULT 0,
    commission_amount DECIMAL(15,2) DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 0,
    sales_rep_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_revenue_records
ALTER TABLE public.crm_revenue_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_revenue_records
CREATE POLICY "SA and AD can manage revenue records"
ON public.crm_revenue_records FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM LEAD SCORING RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(50) NOT NULL CHECK (operator IN ('equals', 'contains', 'greater_than', 'less_than', 'not_equals')),
    field_value VARCHAR(255) NOT NULL,
    score_points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_lead_scoring_rules
ALTER TABLE public.crm_lead_scoring_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_lead_scoring_rules
CREATE POLICY "SA and AD can manage lead scoring rules"
ON public.crm_lead_scoring_rules FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM ASSIGNMENT RULES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_assignment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    criteria JSONB NOT NULL,
    assigned_user_id UUID REFERENCES auth.users(id),
    assignment_type VARCHAR(50) DEFAULT 'round_robin' CHECK (assignment_type IN ('round_robin', 'load_based', 'geographic', 'skill_based')),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_assignment_rules
ALTER TABLE public.crm_assignment_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_assignment_rules
CREATE POLICY "SA and AD can manage assignment rules"
ON public.crm_assignment_rules FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- CRM ANALYTICS CACHE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cache_key VARCHAR(255) NOT NULL UNIQUE,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on crm_analytics_cache
ALTER TABLE public.crm_analytics_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_analytics_cache
CREATE POLICY "SA and AD can access analytics cache"
ON public.crm_analytics_cache FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_source ON public.crm_leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON public.crm_leads(created_at);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON public.crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_assigned_to ON public.crm_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_lead_id ON public.crm_opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close_date ON public.crm_opportunities(expected_close_date);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON public.crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON public.crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created_by ON public.crm_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(activity_date);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON public.crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON public.crm_tasks(due_date);

-- Revenue records indexes
CREATE INDEX IF NOT EXISTS idx_crm_revenue_date ON public.crm_revenue_records(revenue_date);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_opportunity_id ON public.crm_revenue_records(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_type ON public.crm_revenue_records(revenue_type);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all CRM tables
CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_opportunities_updated_at BEFORE UPDATE ON public.crm_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_email_campaigns_updated_at BEFORE UPDATE ON public.crm_email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_pipeline_stages_updated_at BEFORE UPDATE ON public.crm_pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_revenue_records_updated_at BEFORE UPDATE ON public.crm_revenue_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_lead_scoring_rules_updated_at BEFORE UPDATE ON public.crm_lead_scoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_assignment_rules_updated_at BEFORE UPDATE ON public.crm_assignment_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT PIPELINE STAGES
-- =====================================================
INSERT INTO public.crm_pipeline_stages (stage_name, stage_description, stage_order, stage_probability, stage_color) VALUES
('Prospect', 'Initial contact and qualification', 1, 10, '#EF4444'),
('Proposal', 'Proposal sent and under review', 2, 25, '#F59E0B'),
('Negotiation', 'Terms and pricing negotiation', 3, 50, '#3B82F6'),
('Closed Won', 'Deal successfully closed', 4, 100, '#10B981'),
('Closed Lost', 'Deal lost or cancelled', 5, 0, '#6B7280')
ON CONFLICT DO NOTHING;

-- =====================================================
-- INSERT DEFAULT LEAD SCORING RULES
-- =====================================================
INSERT INTO public.crm_lead_scoring_rules (rule_name, rule_description, field_name, operator, field_value, score_points) VALUES
('Enterprise Company', 'Large company size indicates higher value', 'company_name', 'contains', 'enterprise', 20),
('Training Industry', 'Companies in training industry', 'company_name', 'contains', 'training', 15),
('Manager Title', 'Management level contact', 'job_title', 'contains', 'manager', 10),
('Director Title', 'Director level contact', 'job_title', 'contains', 'director', 15),
('Website Source', 'Lead from website', 'lead_source', 'equals', 'website', 5),
('Referral Source', 'Lead from referral', 'lead_source', 'equals', 'referral', 25)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.crm_leads IS 'CRM leads table storing potential customer information';
COMMENT ON TABLE public.crm_opportunities IS 'CRM opportunities table storing sales opportunities';
COMMENT ON TABLE public.crm_activities IS 'CRM activities table storing customer interactions';
COMMENT ON TABLE public.crm_tasks IS 'CRM tasks table storing follow-up tasks';
COMMENT ON TABLE public.crm_email_campaigns IS 'CRM email campaigns table storing marketing campaigns';
COMMENT ON TABLE public.crm_pipeline_stages IS 'CRM pipeline stages configuration';
COMMENT ON TABLE public.crm_revenue_records IS 'CRM revenue tracking table';
COMMENT ON TABLE public.crm_lead_scoring_rules IS 'CRM lead scoring rules configuration';
COMMENT ON TABLE public.crm_assignment_rules IS 'CRM lead assignment rules configuration';
COMMENT ON TABLE public.crm_analytics_cache IS 'CRM analytics data cache for performance';