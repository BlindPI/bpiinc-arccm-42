-- CRM Critical Fixes Phase 1: Database Schema Alignment (FIXED VERSION)
-- This migration fixes critical table mismatches and creates missing core tables

-- =====================================================
-- STEP 1: CREATE MISSING CORE TABLES
-- =====================================================

-- Create crm_contacts table (missing but required by CRMService)
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    title VARCHAR(255),
    department VARCHAR(255),
    account_id UUID, -- Will add FK constraint after crm_accounts is created
    contact_status VARCHAR(50) DEFAULT 'active' CHECK (contact_status IN ('active', 'inactive')),
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    lead_source VARCHAR(50),
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    do_not_call BOOLEAN DEFAULT FALSE,
    do_not_email BOOLEAN DEFAULT FALSE,
    notes TEXT,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create crm_accounts table (missing but required by CRMService)
CREATE TABLE IF NOT EXISTS public.crm_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'prospect' CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor')),
    account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive')),
    industry VARCHAR(255),
    company_size VARCHAR(100),
    website VARCHAR(255),
    phone VARCHAR(50),
    fax VARCHAR(50),
    billing_address TEXT,
    shipping_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    annual_revenue DECIMAL(15,2),
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    primary_contact_id UUID, -- Will add FK constraint after both tables exist
    parent_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Add foreign key constraints after both tables exist
ALTER TABLE public.crm_contacts 
ADD CONSTRAINT fk_contacts_account 
FOREIGN KEY (account_id) REFERENCES public.crm_accounts(id) ON DELETE SET NULL;

ALTER TABLE public.crm_accounts 
ADD CONSTRAINT fk_accounts_primary_contact 
FOREIGN KEY (primary_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 2: FIX EMAIL CAMPAIGN SYSTEM TABLE MISMATCH
-- =====================================================

-- Create email_campaigns table (expected by EmailCampaignService)
CREATE TABLE IF NOT EXISTS public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(100) DEFAULT 'newsletter' CHECK (campaign_type IN ('newsletter', 'promotional', 'drip', 'event', 'follow_up')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
    subject_line VARCHAR(255),
    content TEXT,
    html_content TEXT,
    sender_name VARCHAR(255) NOT NULL,
    sender_email VARCHAR(255) NOT NULL,
    reply_to_email VARCHAR(255),
    target_audience JSONB,
    send_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    automation_rules JSONB,
    tracking_enabled BOOLEAN DEFAULT TRUE,
    -- Additional compatibility fields
    email_content TEXT,
    target_segments JSONB,
    personalization_fields JSONB,
    email_template_id UUID,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    sent_date TIMESTAMP WITH TIME ZONE,
    leads_generated INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    revenue_attributed DECIMAL(15,2) DEFAULT 0,
    campaign_cost DECIMAL(15,2) DEFAULT 0,
    geographic_targeting TEXT[],
    industry_targeting TEXT[]
);

-- Create email_templates table (missing but required by EmailCampaignService)
CREATE TABLE IF NOT EXISTS public.email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(100) NOT NULL,
    subject_line VARCHAR(255) NOT NULL,
    email_content TEXT NOT NULL,
    html_content TEXT,
    personalization_fields JSONB,
    design_data JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    variables TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create campaign_metrics table (missing but required by EmailCampaignService)
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,
    open_rate DECIMAL(5,2) DEFAULT 0,
    click_rate DECIMAL(5,2) DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0,
    unsubscribe_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id)
);

-- =====================================================
-- STEP 3: ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to crm_leads (based on types/crm.ts interface)
DO $$
BEGIN
    -- Add columns that might be missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'notes') THEN
        ALTER TABLE public.crm_leads ADD COLUMN notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'last_activity_date') THEN
        ALTER TABLE public.crm_leads ADD COLUMN last_activity_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'training_urgency') THEN
        ALTER TABLE public.crm_leads ADD COLUMN training_urgency VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'estimated_participant_count') THEN
        ALTER TABLE public.crm_leads ADD COLUMN estimated_participant_count INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'preferred_training_format') THEN
        ALTER TABLE public.crm_leads ADD COLUMN preferred_training_format VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'budget_range') THEN
        ALTER TABLE public.crm_leads ADD COLUMN budget_range VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'decision_timeline') THEN
        ALTER TABLE public.crm_leads ADD COLUMN decision_timeline VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'certification_requirements') THEN
        ALTER TABLE public.crm_leads ADD COLUMN certification_requirements TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'province') THEN
        ALTER TABLE public.crm_leads ADD COLUMN province VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'city') THEN
        ALTER TABLE public.crm_leads ADD COLUMN city VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'postal_code') THEN
        ALTER TABLE public.crm_leads ADD COLUMN postal_code VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'website') THEN
        ALTER TABLE public.crm_leads ADD COLUMN website VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'linkedin_profile') THEN
        ALTER TABLE public.crm_leads ADD COLUMN linkedin_profile VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'referral_source') THEN
        ALTER TABLE public.crm_leads ADD COLUMN referral_source VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'annual_revenue_range') THEN
        ALTER TABLE public.crm_leads ADD COLUMN annual_revenue_range VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'conversion_date') THEN
        ALTER TABLE public.crm_leads ADD COLUMN conversion_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'industry') THEN
        ALTER TABLE public.crm_leads ADD COLUMN industry VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_leads' AND column_name = 'company_size') THEN
        ALTER TABLE public.crm_leads ADD COLUMN company_size VARCHAR(100);
    END IF;
END $$;

-- Add missing columns to crm_opportunities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'account_name') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN account_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'account_id') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'description') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'reason_won_lost') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN reason_won_lost TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'next_step') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN next_step TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'type') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'lead_source') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN lead_source VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_opportunities' AND column_name = 'campaign_id') THEN
        ALTER TABLE public.crm_opportunities ADD COLUMN campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add missing columns to crm_activities
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'due_date') THEN
        ALTER TABLE public.crm_activities ADD COLUMN due_date TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'completed') THEN
        ALTER TABLE public.crm_activities ADD COLUMN completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'status') THEN
        ALTER TABLE public.crm_activities ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'priority') THEN
        ALTER TABLE public.crm_activities ADD COLUMN priority VARCHAR(20) DEFAULT 'medium';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'contact_id') THEN
        ALTER TABLE public.crm_activities ADD COLUMN contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_activities' AND column_name = 'account_id') THEN
        ALTER TABLE public.crm_activities ADD COLUMN account_id UUID REFERENCES public.crm_accounts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account_id ON public.crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON public.crm_contacts(contact_status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_at ON public.crm_contacts(created_at);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name ON public.crm_accounts(account_name);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_type ON public.crm_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_status ON public.crm_accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_assigned_to ON public.crm_accounts(assigned_to);

-- Email campaigns indexes
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_type ON public.email_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON public.email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_send_date ON public.email_campaigns(send_date);

-- Email templates indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- =====================================================
-- STEP 5: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Create triggers for new tables
CREATE TRIGGER update_crm_contacts_updated_at 
    BEFORE UPDATE ON public.crm_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_accounts_updated_at 
    BEFORE UPDATE ON public.crm_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_campaigns_updated_at 
    BEFORE UPDATE ON public.email_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
    BEFORE UPDATE ON public.email_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_metrics_updated_at 
    BEFORE UPDATE ON public.campaign_metrics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 6: INSERT DEFAULT DATA
-- =====================================================

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_type, subject_line, email_content, variables, is_active) VALUES
('Welcome Email', 'welcome', 'Welcome to {{company_name}}!', 'Dear {{first_name}},\n\nWelcome to {{company_name}}! We''re excited to have you on board.\n\nBest regards,\nThe Team', ARRAY['company_name', 'first_name'], TRUE),
('Newsletter Template', 'newsletter', '{{company_name}} Monthly Newsletter - {{month}}', 'Hello {{first_name}},\n\nHere are the latest updates from {{company_name}} for {{month}}.\n\n[Newsletter Content]\n\nBest regards,\nThe {{company_name}} Team', ARRAY['company_name', 'first_name', 'month'], TRUE),
('Follow-up Email', 'follow_up', 'Following up on our conversation', 'Hi {{first_name}},\n\nI wanted to follow up on our recent conversation about {{topic}}.\n\n[Follow-up content]\n\nLooking forward to hearing from you.\n\nBest regards,\n{{sender_name}}', ARRAY['first_name', 'topic', 'sender_name'], TRUE),
('Training Proposal', 'promotional', 'Training Proposal for {{company_name}}', 'Dear {{first_name}},\n\nThank you for your interest in our training programs. Please find attached our proposal for {{company_name}}.\n\n[Proposal details]\n\nWe look forward to working with you.\n\nBest regards,\nTraining Team', ARRAY['first_name', 'company_name'], TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: DISABLE RLS TEMPORARILY (CONSISTENT WITH EXISTING APPROACH)
-- =====================================================

-- Keep RLS disabled for now to maintain consistency with existing CRM tables
ALTER TABLE public.crm_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.crm_contacts IS 'CRM contacts table - core customer contact information';
COMMENT ON TABLE public.crm_accounts IS 'CRM accounts table - customer account/company information';
COMMENT ON TABLE public.email_campaigns IS 'Email marketing campaigns - compatible with EmailCampaignService';
COMMENT ON TABLE public.email_templates IS 'Email templates for campaign creation';
COMMENT ON TABLE public.campaign_metrics IS 'Email campaign performance metrics and analytics';

-- Success message
SELECT 'CRM Phase 1 Critical Fixes Applied Successfully - FIXED VERSION' as status;