
-- Create missing CRM tables and enhance existing ones
-- This migration completes the CRM schema for production readiness

-- Create CRM leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  job_title TEXT,
  lead_status TEXT NOT NULL DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  lead_source TEXT NOT NULL DEFAULT 'website' CHECK (lead_source IN ('website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other')),
  lead_type TEXT DEFAULT 'individual' CHECK (lead_type IN ('individual', 'corporate', 'government')),
  lead_score INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES auth.users(id),
  notes TEXT,
  training_urgency TEXT CHECK (training_urgency IN ('immediate', 'within_month', 'within_quarter', 'planning')),
  estimated_participant_count INTEGER,
  conversion_date TIMESTAMP WITH TIME ZONE,
  converted_to_contact_id UUID,
  converted_to_account_id UUID,
  qualification_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM opportunities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_name TEXT NOT NULL,
  account_name TEXT,
  account_id UUID,
  estimated_value DECIMAL(15,2) DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'prospect' CHECK (stage IN ('prospect', 'proposal', 'negotiation', 'closed_won', 'closed_lost')),
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  opportunity_status TEXT DEFAULT 'open' CHECK (opportunity_status IN ('open', 'closed')),
  opportunity_type TEXT DEFAULT 'training_contract',
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  lead_id UUID REFERENCES public.crm_leads(id),
  weighted_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  mobile_phone TEXT,
  title TEXT,
  department TEXT,
  account_id UUID,
  contact_status TEXT DEFAULT 'active' CHECK (contact_status IN ('active', 'inactive')),
  lead_source TEXT,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'mail')),
  do_not_call BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  last_activity_date DATE,
  notes TEXT,
  converted_from_lead_id UUID REFERENCES public.crm_leads(id),
  lead_conversion_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'prospect' CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor')),
  industry TEXT,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'prospect')),
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  company_size TEXT,
  fax TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_postal_code TEXT,
  billing_country TEXT,
  shipping_address TEXT,
  annual_revenue DECIMAL(15,2),
  notes TEXT,
  converted_from_lead_id UUID REFERENCES public.crm_leads(id),
  lead_conversion_date TIMESTAMP WITH TIME ZONE,
  primary_contact_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL DEFAULT 'task' CHECK (activity_type IN ('call', 'email', 'meeting', 'task', 'note')),
  subject TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  lead_id UUID REFERENCES public.crm_leads(id),
  opportunity_id UUID REFERENCES public.crm_opportunities(id),
  contact_id UUID REFERENCES public.crm_contacts(id),
  account_id UUID REFERENCES public.crm_accounts(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM assignment rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  assignment_type TEXT NOT NULL DEFAULT 'round_robin' CHECK (assignment_type IN ('round_robin', 'load_based', 'territory', 'skills')),
  assigned_user_id UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  working_hours JSONB DEFAULT '{}',
  escalation_rules JSONB DEFAULT '{}',
  automation_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM lead scoring rules table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_lead_scoring_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  criteria JSONB NOT NULL DEFAULT '{}',
  score_value INTEGER NOT NULL DEFAULT 0,
  rule_type TEXT NOT NULL DEFAULT 'demographic' CHECK (rule_type IN ('demographic', 'behavioral', 'firmographic')),
  field_name TEXT,
  operator TEXT CHECK (operator IN ('equals', 'contains', 'greater_than', 'less_than', 'in_list')),
  field_value TEXT,
  score_points INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create CRM email campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.crm_email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'newsletter',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
  target_audience TEXT NOT NULL,
  sent_count INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  click_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  campaign_cost DECIMAL(10,2) DEFAULT 0,
  revenue_attributed DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to existing tables if they don't exist
DO $$
BEGIN
  -- Add location_id to profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location_id') THEN
    ALTER TABLE public.profiles ADD COLUMN location_id UUID REFERENCES public.locations(id);
  END IF;
  
  -- Add performance_score to profiles if not exists  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'performance_score') THEN
    ALTER TABLE public.profiles ADD COLUMN performance_score DECIMAL(5,2) DEFAULT 0;
  END IF;
  
  -- Add training_hours to profiles if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'training_hours') THEN
    ALTER TABLE public.profiles ADD COLUMN training_hours INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_scoring_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_email_campaigns ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for CRM tables (SA/AD access)
CREATE POLICY "SA and AD can manage CRM leads" ON public.crm_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage CRM opportunities" ON public.crm_opportunities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage CRM contacts" ON public.crm_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage CRM accounts" ON public.crm_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage CRM activities" ON public.crm_activities FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage assignment rules" ON public.crm_assignment_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage scoring rules" ON public.crm_lead_scoring_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

CREATE POLICY "SA and AD can manage email campaigns" ON public.crm_email_campaigns FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SA', 'AD'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crm_leads_email ON public.crm_leads(email);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON public.crm_leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_assigned_to ON public.crm_leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON public.crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_crm_activities_date ON public.crm_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);

-- Add update triggers for timestamp columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for all CRM tables
DROP TRIGGER IF EXISTS update_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER update_crm_leads_updated_at
    BEFORE UPDATE ON public.crm_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_opportunities_updated_at ON public.crm_opportunities;
CREATE TRIGGER update_crm_opportunities_updated_at
    BEFORE UPDATE ON public.crm_opportunities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON public.crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at
    BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_accounts_updated_at ON public.crm_accounts;
CREATE TRIGGER update_crm_accounts_updated_at
    BEFORE UPDATE ON public.crm_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON public.crm_activities;
CREATE TRIGGER update_crm_activities_updated_at
    BEFORE UPDATE ON public.crm_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
