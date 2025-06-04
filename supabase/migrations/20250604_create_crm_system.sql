-- Assured Response Sales CRM System Database Schema
-- Created: 2025-06-04
-- Purpose: Comprehensive CRM for driving certificate sales and AP recruitment

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CRM Leads (All potential customers)
CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lead Classification
    lead_type VARCHAR(50) NOT NULL CHECK (lead_type IN ('individual', 'corporate', 'potential_ap')),
    lead_source VARCHAR(100) NOT NULL,
    lead_status VARCHAR(50) DEFAULT 'new',
    
    -- Contact Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    job_title VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Address Information
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(50),
    postal_code VARCHAR(20),
    
    -- Business Information (for corporate/AP leads)
    industry VARCHAR(100),
    company_size VARCHAR(50), -- '1-10', '11-50', '51-200', '201-500', '500+'
    annual_revenue_range VARCHAR(50),
    number_of_employees INTEGER,
    
    -- Training Needs
    required_certifications TEXT[],
    training_urgency VARCHAR(50), -- 'immediate', 'within_month', 'within_quarter', 'planning'
    preferred_location VARCHAR(255),
    preferred_training_format VARCHAR(50), -- 'in_person', 'blended', 'flexible'
    estimated_participant_count INTEGER,
    budget_range VARCHAR(50),
    
    -- Lead Scoring
    lead_score INTEGER DEFAULT 0,
    qualification_notes TEXT,
    pain_points TEXT[],
    decision_timeline VARCHAR(50),
    decision_makers JSONB,
    
    -- Assignment and Tracking
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- Integration
    converted_to_opportunity_id UUID,
    converted_date TIMESTAMP WITH TIME ZONE,
    
    status VARCHAR(50) DEFAULT 'active'
);

-- CRM Opportunities (Qualified sales opportunities)
CREATE TABLE crm_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id),
    
    -- Opportunity Details
    opportunity_name VARCHAR(255) NOT NULL,
    opportunity_type VARCHAR(50) NOT NULL, -- 'individual_training', 'corporate_contract', 'ap_partnership'
    stage VARCHAR(50) NOT NULL,
    
    -- Financial Information
    estimated_value DECIMAL(12,2) NOT NULL,
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Training Details
    certification_types TEXT[],
    participant_count INTEGER,
    training_location VARCHAR(255),
    preferred_ap_id INTEGER REFERENCES authorized_providers(id),
    training_schedule JSONB,
    
    -- Corporate Contract Details (for corporate opportunities)
    contract_duration_months INTEGER,
    recurring_training BOOLEAN DEFAULT FALSE,
    volume_discount_applicable BOOLEAN DEFAULT FALSE,
    
    -- AP Partnership Details (for potential AP opportunities)
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
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    status VARCHAR(50) DEFAULT 'open'
);

-- CRM Activities (All sales interactions)
CREATE TABLE crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- 'call', 'email', 'meeting', 'demo', 'proposal', 'follow_up'
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Timing
    activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER,
    
    -- Outcome
    outcome VARCHAR(100), -- 'positive', 'neutral', 'negative', 'no_response'
    outcome_notes TEXT,
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_type VARCHAR(50),
    
    -- Participants and Location
    attendees JSONB,
    location VARCHAR(255),
    meeting_type VARCHAR(50), -- 'phone', 'video', 'in_person', 'email'
    
    -- Documents and Attachments
    documents JSONB,
    
    -- Management
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Sales Pipeline Stages
CREATE TABLE crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_type VARCHAR(50) NOT NULL, -- 'individual', 'corporate', 'ap_partnership'
    stage_name VARCHAR(100) NOT NULL,
    stage_order INTEGER NOT NULL,
    probability_default INTEGER,
    is_closed_won BOOLEAN DEFAULT FALSE,
    is_closed_lost BOOLEAN DEFAULT FALSE,
    automation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Email Campaigns
CREATE TABLE crm_email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- 'lead_nurture', 'promotional', 'educational', 'follow_up'
    target_audience VARCHAR(50) NOT NULL, -- 'individuals', 'corporate', 'potential_aps', 'all'
    
    -- Email Content
    subject_line VARCHAR(255) NOT NULL,
    email_template_id UUID,
    personalization_fields JSONB,
    
    -- Targeting
    target_segments JSONB,
    geographic_targeting TEXT[],
    industry_targeting TEXT[],
    
    -- Scheduling
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    
    -- Performance Metrics
    status VARCHAR(50) DEFAULT 'draft',
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
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Tasks and Reminders
CREATE TABLE crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Task Details
    task_title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50), -- 'follow_up', 'proposal', 'demo', 'contract_review', 'onboarding'
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    
    -- Timing
    due_date TIMESTAMP WITH TIME ZONE,
    completed_date TIMESTAMP WITH TIME ZONE,
    reminder_date TIMESTAMP WITH TIME ZONE,
    
    -- Assignment
    assigned_to UUID REFERENCES profiles(id),
    created_by UUID REFERENCES profiles(id),
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    completion_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Revenue Tracking
CREATE TABLE crm_revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES crm_opportunities(id),
    
    -- Revenue Details
    revenue_type VARCHAR(50) NOT NULL, -- 'certificate_sale', 'corporate_contract', 'ap_setup_fee', 'recurring_revenue'
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CAD',
    
    -- Timing
    revenue_date DATE NOT NULL,
    billing_period_start DATE,
    billing_period_end DATE,
    
    -- Attribution
    ap_location_id INTEGER REFERENCES authorized_providers(id),
    certificate_count INTEGER,
    participant_count INTEGER,
    
    -- Commission and Tracking
    sales_rep_id UUID REFERENCES profiles(id),
    commission_rate DECIMAL(5,2),
    commission_amount DECIMAL(10,2),
    
    -- Integration
    certificate_request_ids TEXT[],
    invoice_reference VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM Analytics Cache
CREATE TABLE crm_analytics_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_type VARCHAR(100) NOT NULL,
    metric_period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    metric_date DATE NOT NULL,
    metric_data JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_crm_leads_email ON crm_leads(email);
CREATE INDEX idx_crm_leads_assigned_to ON crm_leads(assigned_to);
CREATE INDEX idx_crm_leads_lead_type ON crm_leads(lead_type);
CREATE INDEX idx_crm_leads_lead_source ON crm_leads(lead_source);
CREATE INDEX idx_crm_leads_lead_score ON crm_leads(lead_score DESC);
CREATE INDEX idx_crm_leads_next_follow_up ON crm_leads(next_follow_up_date) WHERE next_follow_up_date IS NOT NULL;

CREATE INDEX idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX idx_crm_opportunities_assigned_to ON crm_opportunities(assigned_to);
CREATE INDEX idx_crm_opportunities_expected_close ON crm_opportunities(expected_close_date);
CREATE INDEX idx_crm_opportunities_value ON crm_opportunities(estimated_value DESC);

CREATE INDEX idx_crm_activities_lead_id ON crm_activities(lead_id);
CREATE INDEX idx_crm_activities_opportunity_id ON crm_activities(opportunity_id);
CREATE INDEX idx_crm_activities_date ON crm_activities(activity_date DESC);
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);

CREATE INDEX idx_crm_tasks_assigned_to ON crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due_date ON crm_tasks(due_date) WHERE status != 'completed';
CREATE INDEX idx_crm_tasks_status ON crm_tasks(status);

CREATE INDEX idx_crm_revenue_date ON crm_revenue_records(revenue_date DESC);
CREATE INDEX idx_crm_revenue_ap_location ON crm_revenue_records(ap_location_id);
CREATE INDEX idx_crm_revenue_sales_rep ON crm_revenue_records(sales_rep_id);

-- Insert default pipeline stages
INSERT INTO crm_pipeline_stages (pipeline_type, stage_name, stage_order, probability_default, is_closed_won, is_closed_lost) VALUES
-- Individual Training Pipeline
('individual', 'New Lead', 1, 0, FALSE, FALSE),
('individual', 'Qualified', 2, 20, FALSE, FALSE),
('individual', 'Needs Assessment', 3, 40, FALSE, FALSE),
('individual', 'Location Matched', 4, 60, FALSE, FALSE),
('individual', 'Scheduled', 5, 80, FALSE, FALSE),
('individual', 'Closed Won', 6, 100, TRUE, FALSE),
('individual', 'Closed Lost', 7, 0, FALSE, TRUE),

-- Corporate Training Pipeline
('corporate', 'Initial Contact', 1, 10, FALSE, FALSE),
('corporate', 'Needs Discovery', 2, 25, FALSE, FALSE),
('corporate', 'Proposal Requested', 3, 40, FALSE, FALSE),
('corporate', 'Proposal Sent', 4, 60, FALSE, FALSE),
('corporate', 'Negotiation', 5, 75, FALSE, FALSE),
('corporate', 'Contract Review', 6, 90, FALSE, FALSE),
('corporate', 'Closed Won', 7, 100, TRUE, FALSE),
('corporate', 'Closed Lost', 8, 0, FALSE, TRUE),

-- AP Partnership Pipeline
('ap_partnership', 'Inquiry', 1, 15, FALSE, FALSE),
('ap_partnership', 'Initial Qualification', 2, 30, FALSE, FALSE),
('ap_partnership', 'Application Submitted', 3, 50, FALSE, FALSE),
('ap_partnership', 'Application Review', 4, 70, FALSE, FALSE),
('ap_partnership', 'Site Visit/Interview', 5, 85, FALSE, FALSE),
('ap_partnership', 'Authorization Approved', 6, 100, TRUE, FALSE),
('ap_partnership', 'Authorization Declined', 7, 0, FALSE, TRUE);

-- Enable Row Level Security (RLS)
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for AD and SA users only
CREATE POLICY "CRM access for AD and SA users" ON crm_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_opportunities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_activities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_pipeline_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_email_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_revenue_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

CREATE POLICY "CRM access for AD and SA users" ON crm_analytics_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('AD', 'SA')
        )
    );

-- Create functions for CRM operations
CREATE OR REPLACE FUNCTION calculate_lead_score(lead_id UUID)
RETURNS INTEGER AS $$
DECLARE
    lead_record crm_leads%ROWTYPE;
    score INTEGER := 0;
BEGIN
    SELECT * INTO lead_record FROM crm_leads WHERE id = lead_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Urgency scoring (40 points max)
    CASE lead_record.training_urgency
        WHEN 'immediate' THEN score := score + 40;
        WHEN 'within_month' THEN score := score + 30;
        WHEN 'within_quarter' THEN score := score + 20;
        WHEN 'planning' THEN score := score + 10;
        ELSE score := score + 0;
    END CASE;
    
    -- Company size scoring (for corporate leads)
    IF lead_record.lead_type = 'corporate' THEN
        CASE lead_record.company_size
            WHEN '500+' THEN score := score + 30;
            WHEN '201-500' THEN score := score + 25;
            WHEN '51-200' THEN score := score + 20;
            WHEN '11-50' THEN score := score + 15;
            WHEN '1-10' THEN score := score + 10;
            ELSE score := score + 0;
        END CASE;
    END IF;
    
    -- Contact quality scoring (20 points max)
    IF lead_record.phone IS NOT NULL AND lead_record.email IS NOT NULL THEN
        score := score + 10;
    END IF;
    IF lead_record.company_name IS NOT NULL THEN
        score := score + 5;
    END IF;
    IF lead_record.job_title IS NOT NULL THEN
        score := score + 5;
    END IF;
    
    -- Participant count scoring (for volume)
    IF lead_record.estimated_participant_count IS NOT NULL THEN
        IF lead_record.estimated_participant_count >= 100 THEN
            score := score + 25;
        ELSIF lead_record.estimated_participant_count >= 50 THEN
            score := score + 20;
        ELSIF lead_record.estimated_participant_count >= 20 THEN
            score := score + 15;
        ELSIF lead_record.estimated_participant_count >= 10 THEN
            score := score + 10;
        ELSIF lead_record.estimated_participant_count >= 5 THEN
            score := score + 5;
        END IF;
    END IF;
    
    -- Cap score at 100
    IF score > 100 THEN
        score := 100;
    END IF;
    
    -- Update the lead record
    UPDATE crm_leads SET lead_score = score, updated_at = NOW() WHERE id = lead_id;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to auto-assign leads
CREATE OR REPLACE FUNCTION auto_assign_lead(lead_id UUID)
RETURNS UUID AS $$
DECLARE
    lead_record crm_leads%ROWTYPE;
    assigned_user_id UUID;
BEGIN
    SELECT * INTO lead_record FROM crm_leads WHERE id = lead_id;
    
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    
    -- Simple round-robin assignment to AD/SA users
    -- In a real implementation, this could be more sophisticated
    SELECT id INTO assigned_user_id 
    FROM profiles 
    WHERE role IN ('AD', 'SA') 
    AND status = 'active'
    ORDER BY RANDOM() 
    LIMIT 1;
    
    IF assigned_user_id IS NOT NULL THEN
        UPDATE crm_leads 
        SET assigned_to = assigned_user_id, updated_at = NOW() 
        WHERE id = lead_id;
    END IF;
    
    RETURN assigned_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-calculate lead score on insert/update
CREATE OR REPLACE FUNCTION trigger_calculate_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.lead_score := calculate_lead_score(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER crm_leads_score_trigger
    AFTER INSERT OR UPDATE ON crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_lead_score();

-- Create function to get pipeline metrics
CREATE OR REPLACE FUNCTION get_pipeline_metrics(pipeline_type_param VARCHAR DEFAULT NULL)
RETURNS TABLE(
    stage_name VARCHAR,
    opportunity_count BIGINT,
    total_value DECIMAL,
    avg_probability INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.stage_name,
        COUNT(o.id) as opportunity_count,
        COALESCE(SUM(o.estimated_value), 0) as total_value,
        COALESCE(AVG(o.probability)::INTEGER, 0) as avg_probability
    FROM crm_pipeline_stages ps
    LEFT JOIN crm_opportunities o ON o.stage = ps.stage_name 
        AND (pipeline_type_param IS NULL OR ps.pipeline_type = pipeline_type_param)
        AND o.status = 'open'
    WHERE pipeline_type_param IS NULL OR ps.pipeline_type = pipeline_type_param
    GROUP BY ps.stage_name, ps.stage_order
    ORDER BY ps.stage_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get revenue metrics
CREATE OR REPLACE FUNCTION get_revenue_metrics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_revenue DECIMAL,
    certificate_revenue DECIMAL,
    corporate_revenue DECIMAL,
    ap_setup_revenue DECIMAL,
    transaction_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN revenue_type = 'certificate_sale' THEN amount ELSE 0 END), 0) as certificate_revenue,
        COALESCE(SUM(CASE WHEN revenue_type = 'corporate_contract' THEN amount ELSE 0 END), 0) as corporate_revenue,
        COALESCE(SUM(CASE WHEN revenue_type = 'ap_setup_fee' THEN amount ELSE 0 END), 0) as ap_setup_revenue,
        COUNT(*) as transaction_count
    FROM crm_revenue_records
    WHERE revenue_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;