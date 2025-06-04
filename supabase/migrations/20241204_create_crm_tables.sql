-- CRM System Database Schema
-- This migration creates all necessary tables for the comprehensive CRM system

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CRM Leads Table
CREATE TABLE IF NOT EXISTS crm_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Lead Classification
    lead_type VARCHAR(20) NOT NULL CHECK (lead_type IN ('individual', 'corporate', 'potential_ap')),
    lead_source VARCHAR(100) NOT NULL,
    lead_status VARCHAR(50) NOT NULL DEFAULT 'new',
    
    -- Contact Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),
    job_title VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(10),
    postal_code VARCHAR(20),
    
    -- Business Information
    industry VARCHAR(100),
    company_size VARCHAR(20) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
    annual_revenue_range VARCHAR(50),
    number_of_employees INTEGER,
    
    -- Training Needs
    required_certifications TEXT[],
    training_urgency VARCHAR(20) CHECK (training_urgency IN ('immediate', 'within_month', 'within_quarter', 'planning')),
    preferred_location VARCHAR(255),
    preferred_training_format VARCHAR(20) CHECK (preferred_training_format IN ('in_person', 'blended', 'flexible')),
    estimated_participant_count INTEGER,
    budget_range VARCHAR(50),
    
    -- Lead Scoring
    lead_score INTEGER DEFAULT 0,
    qualification_notes TEXT,
    pain_points TEXT[],
    decision_timeline VARCHAR(100),
    decision_makers JSONB,
    
    -- Assignment and Tracking
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- Integration
    converted_to_opportunity_id UUID,
    converted_date TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) DEFAULT 'active'
);

-- CRM Opportunities Table
CREATE TABLE IF NOT EXISTS crm_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id),
    
    -- Opportunity Details
    opportunity_name VARCHAR(255) NOT NULL,
    opportunity_type VARCHAR(30) NOT NULL CHECK (opportunity_type IN ('individual_training', 'corporate_contract', 'ap_partnership')),
    stage VARCHAR(100) NOT NULL,
    
    -- Financial Information
    estimated_value DECIMAL(12,2) NOT NULL,
    probability INTEGER DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Training Details
    certification_types TEXT[],
    participant_count INTEGER,
    training_location VARCHAR(255),
    preferred_ap_id INTEGER,
    training_schedule JSONB,
    
    -- Corporate Contract Details
    contract_duration_months INTEGER,
    recurring_training BOOLEAN DEFAULT FALSE,
    volume_discount_applicable BOOLEAN DEFAULT FALSE,
    
    -- AP Partnership Details
    proposed_service_areas TEXT[],
    expected_monthly_volume INTEGER,
    setup_investment DECIMAL(10,2),
    
    -- Sales Process
    proposal_sent_date DATE,
    proposal_value DECIMAL(12,2),
    competitor_analysis JSONB,
    objections_notes TEXT,
    next_steps TEXT,
    
    -- Management
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    status VARCHAR(50) DEFAULT 'open'
);

-- CRM Activities Table
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Activity Details
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'demo', 'proposal', 'follow_up')),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    
    -- Outcome
    outcome VARCHAR(20) CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_response')),
    outcome_notes TEXT,
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_type VARCHAR(50),
    
    -- Participants and Location
    attendees JSONB,
    location VARCHAR(255),
    meeting_type VARCHAR(20) CHECK (meeting_type IN ('phone', 'video', 'in_person', 'email')),
    
    -- Documents and Attachments
    documents JSONB,
    
    -- Management
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Tasks Table
CREATE TABLE IF NOT EXISTS crm_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES crm_leads(id),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Task Details
    task_title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(30) CHECK (task_type IN ('follow_up', 'proposal', 'demo', 'contract_review', 'onboarding')),
    priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    completion_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Pipeline Stages Table
CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stage_name VARCHAR(100) NOT NULL,
    stage_description TEXT,
    stage_order INTEGER NOT NULL,
    probability_percentage INTEGER DEFAULT 50 CHECK (probability_percentage >= 0 AND probability_percentage <= 100),
    is_active BOOLEAN DEFAULT TRUE,
    stage_color VARCHAR(7) DEFAULT '#3b82f6',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(stage_order)
);

-- CRM Lead Scoring Rules Table
CREATE TABLE IF NOT EXISTS crm_lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    field_name VARCHAR(50) NOT NULL,
    operator VARCHAR(20) NOT NULL CHECK (operator IN ('equals', 'contains', 'greater_than', 'less_than', 'in_range')),
    field_value VARCHAR(255) NOT NULL,
    score_points INTEGER NOT NULL CHECK (score_points >= -100 AND score_points <= 100),
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Assignment Rules Table
CREATE TABLE IF NOT EXISTS crm_assignment_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(100) NOT NULL,
    rule_description TEXT,
    criteria JSONB NOT NULL DEFAULT '{}',
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('round_robin', 'territory_based', 'skill_based', 'workload_based')),
    assigned_users UUID[] NOT NULL,
    priority INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Email Campaigns Table
CREATE TABLE IF NOT EXISTS crm_email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(20) NOT NULL CHECK (campaign_type IN ('lead_nurture', 'promotional', 'educational', 'follow_up')),
    target_audience VARCHAR(20) NOT NULL CHECK (target_audience IN ('individuals', 'corporate', 'potential_aps', 'all')),
    
    -- Email Content
    subject_line VARCHAR(255) NOT NULL,
    email_template_id VARCHAR(100),
    personalization_fields JSONB,
    
    -- Targeting
    target_segments JSONB,
    geographic_targeting TEXT[],
    industry_targeting TEXT[],
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    
    -- Performance Metrics
    status VARCHAR(20) DEFAULT 'draft',
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(12,2) DEFAULT 0,
    
    -- Management
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Revenue Records Table
CREATE TABLE IF NOT EXISTS crm_revenue_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Revenue Details
    revenue_type VARCHAR(30) NOT NULL CHECK (revenue_type IN ('certificate_sale', 'corporate_contract', 'ap_setup_fee', 'recurring_revenue')),
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    
    -- Timing
    revenue_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Attribution
    ap_location_id INTEGER,
    certificate_count INTEGER,
    participant_count INTEGER,
    
    -- Commission and Tracking
    sales_rep_id UUID REFERENCES auth.users(id),
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(10,2),
    
    -- Integration
    certificate_request_ids TEXT[],
    invoice_reference VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Analytics Cache Table
CREATE TABLE IF NOT EXISTS crm_analytics_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL,
    metric_period VARCHAR(20) NOT NULL CHECK (metric_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    metric_date DATE NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    UNIQUE(metric_type, metric_period, metric_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_type ON crm_leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_source ON crm_leads(lead_source);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created_at ON crm_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_leads_lead_score ON crm_leads(lead_score);
CREATE INDEX IF NOT EXISTS idx_crm_leads_next_follow_up ON crm_leads(next_follow_up_date);

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_assigned_to ON crm_opportunities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_type ON crm_opportunities(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close_date ON crm_opportunities(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_value ON crm_opportunities(estimated_value);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_opportunity_id ON crm_activities(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON crm_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON crm_activities(activity_type);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due_date ON crm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);

CREATE INDEX IF NOT EXISTS idx_crm_revenue_sales_rep ON crm_revenue_records(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_date ON crm_revenue_records(revenue_date);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_type ON crm_revenue_records(revenue_type);
CREATE INDEX IF NOT EXISTS idx_crm_revenue_ap_location ON crm_revenue_records(ap_location_id);

CREATE INDEX IF NOT EXISTS idx_crm_campaigns_type ON crm_email_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON crm_email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_sent_date ON crm_email_campaigns(sent_date);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_leads_updated_at BEFORE UPDATE ON crm_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_opportunities_updated_at BEFORE UPDATE ON crm_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_tasks_updated_at BEFORE UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_pipeline_stages_updated_at BEFORE UPDATE ON crm_pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_lead_scoring_rules_updated_at BEFORE UPDATE ON crm_lead_scoring_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_assignment_rules_updated_at BEFORE UPDATE ON crm_assignment_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_email_campaigns_updated_at BEFORE UPDATE ON crm_email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_revenue_records_updated_at BEFORE UPDATE ON crm_revenue_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default pipeline stages
INSERT INTO crm_pipeline_stages (stage_name, stage_description, stage_order, probability_percentage, stage_color) VALUES
('Qualified Lead', 'Initial qualified lead with basic information', 1, 10, '#ef4444'),
('Needs Analysis', 'Understanding specific training requirements', 2, 25, '#f97316'),
('Proposal Sent', 'Formal proposal has been submitted', 3, 50, '#eab308'),
('Negotiation', 'Discussing terms and finalizing details', 4, 75, '#22c55e'),
('Closed Won', 'Successfully closed opportunity', 5, 100, '#10b981'),
('Closed Lost', 'Opportunity was not successful', 6, 0, '#6b7280');

-- Insert default lead scoring rules
INSERT INTO crm_lead_scoring_rules (rule_name, rule_description, field_name, operator, field_value, score_points, priority) VALUES
('High Urgency Training', 'Immediate training needs get high score', 'training_urgency', 'equals', 'immediate', 20, 1),
('Large Company Size', 'Companies with 200+ employees', 'company_size', 'in_range', '201-500,500+', 15, 2),
('Construction Industry', 'High-value industry for safety training', 'industry', 'contains', 'construction', 10, 3),
('Complete Contact Info', 'Has both phone and email', 'phone', 'contains', '+', 5, 4),
('Corporate Lead Type', 'Corporate leads are higher value', 'lead_type', 'equals', 'corporate', 10, 5),
('High Participant Count', 'Large training groups', 'estimated_participant_count', 'greater_than', '10', 8, 6);

-- Insert default assignment rules
INSERT INTO crm_assignment_rules (rule_name, rule_description, criteria, assignment_type, assigned_users, priority) VALUES
('Ontario Corporate Leads', 'Corporate leads in Ontario', '{"province": "ON", "lead_type": "corporate"}', 'round_robin', ARRAY[]::UUID[], 1),
('BC Individual Leads', 'Individual leads in British Columbia', '{"province": "BC", "lead_type": "individual"}', 'round_robin', ARRAY[]::UUID[], 2),
('Potential AP Leads', 'All potential Authorized Provider leads', '{"lead_type": "potential_ap"}', 'skill_based', ARRAY[]::UUID[], 3);

-- Enable Row Level Security (RLS)
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - can be refined based on specific requirements)
CREATE POLICY "Users can view all CRM data" ON crm_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert CRM leads" ON crm_leads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update CRM leads" ON crm_leads FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete CRM leads" ON crm_leads FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all opportunities" ON crm_opportunities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert opportunities" ON crm_opportunities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update opportunities" ON crm_opportunities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete opportunities" ON crm_opportunities FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all activities" ON crm_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert activities" ON crm_activities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update activities" ON crm_activities FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete activities" ON crm_activities FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all tasks" ON crm_tasks FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can insert tasks" ON crm_tasks FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update tasks" ON crm_tasks FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Users can delete tasks" ON crm_tasks FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view pipeline stages" ON crm_pipeline_stages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage pipeline stages" ON crm_pipeline_stages FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view scoring rules" ON crm_lead_scoring_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage scoring rules" ON crm_lead_scoring_rules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view assignment rules" ON crm_assignment_rules FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage assignment rules" ON crm_assignment_rules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view campaigns" ON crm_email_campaigns FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage campaigns" ON crm_email_campaigns FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view revenue records" ON crm_revenue_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage revenue records" ON crm_revenue_records FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view analytics cache" ON crm_analytics_cache FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage analytics cache" ON crm_analytics_cache FOR ALL USING (auth.role() = 'authenticated');