-- Lead Conversion System Implementation
-- This migration creates the necessary tables and enhancements for a complete lead conversion workflow

-- =====================================================
-- STEP 1: CREATE NEW TABLES
-- =====================================================

-- CRM Contacts Table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    mobile_phone VARCHAR(50),
    title VARCHAR(255),
    department VARCHAR(100),
    account_id UUID, -- Will be linked after accounts table creation
    lead_source VARCHAR(50) DEFAULT 'unknown',
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    contact_status VARCHAR(50) DEFAULT 'active' CHECK (contact_status IN ('active', 'inactive', 'bounced')),
    preferred_contact_method VARCHAR(20) DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'mobile')),
    do_not_call BOOLEAN DEFAULT false,
    do_not_email BOOLEAN DEFAULT false,
    last_activity_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- CRM Accounts Table
CREATE TABLE IF NOT EXISTS public.crm_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) DEFAULT 'prospect' CHECK (account_type IN ('prospect', 'customer', 'partner', 'competitor')),
    industry VARCHAR(100),
    company_size VARCHAR(50),
    annual_revenue DECIMAL(15,2),
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
    parent_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
    converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
    account_status VARCHAR(50) DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
    primary_contact_id UUID, -- Will be set after contacts table creation
    assigned_to UUID REFERENCES auth.users(id),
    last_activity_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- Add foreign key constraint from accounts to contacts
ALTER TABLE public.crm_accounts 
ADD CONSTRAINT crm_accounts_primary_contact_fkey 
FOREIGN KEY (primary_contact_id) REFERENCES public.crm_contacts(id) ON DELETE SET NULL;

-- Add foreign key constraint from contacts to accounts
ALTER TABLE public.crm_contacts 
ADD CONSTRAINT crm_contacts_account_fkey 
FOREIGN KEY (account_id) REFERENCES public.crm_accounts(id) ON DELETE SET NULL;

-- CRM Conversion Audit Table
CREATE TABLE IF NOT EXISTS public.crm_conversion_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    conversion_type VARCHAR(50) NOT NULL CHECK (conversion_type IN ('full', 'contact_only', 'account_only', 'opportunity_only', 'contact_account', 'contact_opportunity', 'account_opportunity')),
    before_data JSONB NOT NULL,
    after_data JSONB NOT NULL,
    created_entities JSONB NOT NULL, -- {contact_id, account_id, opportunity_id}
    conversion_options JSONB, -- Store the conversion options used
    converted_by UUID REFERENCES auth.users(id) NOT NULL,
    conversion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    success BOOLEAN DEFAULT true,
    error_details TEXT
);

-- CRM Conversion Rules Table
CREATE TABLE IF NOT EXISTS public.crm_conversion_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    conditions JSONB NOT NULL, -- Array of condition objects
    actions JSONB NOT NULL, -- Array of action objects
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid()
);

-- CRM Trigger Log Table
CREATE TABLE IF NOT EXISTS public.crm_trigger_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type VARCHAR(50) NOT NULL,
    lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.crm_conversion_rules(id) ON DELETE SET NULL,
    rule_name VARCHAR(255),
    actions_executed JSONB,
    results JSONB,
    success BOOLEAN DEFAULT false,
    error_details TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: ENHANCE EXISTING TABLES
-- =====================================================

-- Add conversion tracking fields to leads table
ALTER TABLE public.crm_leads 
ADD COLUMN IF NOT EXISTS converted_contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_opportunity_id UUID REFERENCES public.crm_opportunities(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS conversion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS conversion_notes TEXT,
ADD COLUMN IF NOT EXISTS converted_by UUID REFERENCES auth.users(id);

-- Add contact and account references to opportunities
ALTER TABLE public.crm_opportunities 
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS converted_from_lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Contacts indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account_id ON public.crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_id ON public.crm_contacts(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON public.crm_contacts(contact_status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_created_at ON public.crm_contacts(created_at);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS idx_crm_accounts_name ON public.crm_accounts(account_name);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_type ON public.crm_accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_industry ON public.crm_accounts(industry);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_assigned_to ON public.crm_accounts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_lead_id ON public.crm_accounts(converted_from_lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_accounts_status ON public.crm_accounts(account_status);

-- Conversion tracking indexes on leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_contact ON public.crm_leads(converted_contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_account ON public.crm_leads(converted_account_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_opportunity ON public.crm_leads(converted_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_conversion_date ON public.crm_leads(conversion_date);
CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_by ON public.crm_leads(converted_by);

-- Opportunities conversion indexes
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_contact_id ON public.crm_opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_account_id ON public.crm_opportunities(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_converted_from_lead ON public.crm_opportunities(converted_from_lead_id);

-- Audit and rules indexes
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_lead_id ON public.crm_conversion_audit(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_date ON public.crm_conversion_audit(conversion_date);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_converted_by ON public.crm_conversion_audit(converted_by);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_audit_success ON public.crm_conversion_audit(success);

CREATE INDEX IF NOT EXISTS idx_crm_conversion_rules_active ON public.crm_conversion_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_conversion_rules_priority ON public.crm_conversion_rules(priority);

CREATE INDEX IF NOT EXISTS idx_crm_trigger_log_lead_id ON public.crm_trigger_log(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_trigger_log_executed_at ON public.crm_trigger_log(executed_at);
CREATE INDEX IF NOT EXISTS idx_crm_trigger_log_success ON public.crm_trigger_log(success);

-- =====================================================
-- STEP 4: ENABLE RLS AND CREATE POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversion_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_conversion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_trigger_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contacts
CREATE POLICY "SA and AD can manage contacts" ON public.crm_contacts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS Policies for accounts
CREATE POLICY "SA and AD can manage accounts" ON public.crm_accounts FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS Policies for conversion audit (read-only for most users)
CREATE POLICY "SA and AD can view conversion audit" ON public.crm_conversion_audit FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "System can insert conversion audit" ON public.crm_conversion_audit FOR INSERT TO authenticated 
WITH CHECK (true); -- Allow system to insert audit records

-- RLS Policies for conversion rules
CREATE POLICY "SA and AD can manage conversion rules" ON public.crm_conversion_rules FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- RLS Policies for trigger log
CREATE POLICY "SA and AD can view trigger log" ON public.crm_trigger_log FOR SELECT TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "System can insert trigger log" ON public.crm_trigger_log FOR INSERT TO authenticated 
WITH CHECK (true); -- Allow system to insert log records

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

-- Add updated_at triggers for new tables
CREATE TRIGGER update_crm_contacts_updated_at 
    BEFORE UPDATE ON public.crm_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

CREATE TRIGGER update_crm_accounts_updated_at 
    BEFORE UPDATE ON public.crm_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

CREATE TRIGGER update_crm_conversion_rules_updated_at 
    BEFORE UPDATE ON public.crm_conversion_rules 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_simple();

-- =====================================================
-- STEP 6: INSERT DEFAULT DATA
-- =====================================================

-- Insert default conversion rules
INSERT INTO public.crm_conversion_rules (rule_name, rule_description, conditions, actions, priority) VALUES
(
    'High Score Auto Convert',
    'Automatically convert leads with score >= 80',
    '[{"field": "lead_score", "operator": "greater_than", "value": 80}]',
    '[{"type": "auto_convert", "parameters": {"createContact": true, "createAccount": true, "createOpportunity": true, "opportunityValue": 5000}}]',
    10
),
(
    'Qualified Lead Notification',
    'Notify sales manager when lead is qualified',
    '[{"field": "lead_status", "operator": "equals", "value": "qualified"}]',
    '[{"type": "notify_user", "parameters": {"user_role": "sales_manager", "message": "New qualified lead requires attention"}}]',
    5
),
(
    'Enterprise Lead High Value',
    'Set high opportunity value for enterprise leads',
    '[{"field": "company_name", "operator": "contains", "value": "enterprise"}, {"field": "lead_status", "operator": "equals", "value": "qualified", "logical_operator": "AND"}]',
    '[{"type": "set_opportunity_value", "parameters": {"value": 25000}}]',
    8
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 7: CREATE MATERIALIZED VIEW FOR ANALYTICS
-- =====================================================

-- Materialized view for conversion analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS public.crm_conversion_analytics AS
SELECT 
    DATE_TRUNC('month', conversion_date) as month,
    COUNT(*) as total_conversions,
    COUNT(CASE WHEN created_entities->>'contactId' IS NOT NULL THEN 1 END) as contacts_created,
    COUNT(CASE WHEN created_entities->>'accountId' IS NOT NULL THEN 1 END) as accounts_created,
    COUNT(CASE WHEN created_entities->>'opportunityId' IS NOT NULL THEN 1 END) as opportunities_created,
    AVG(EXTRACT(EPOCH FROM (conversion_date - (before_data->>'created_at')::timestamp))/86400) as avg_days_to_convert,
    COUNT(CASE WHEN conversion_type = 'full' THEN 1 END) as full_conversions,
    COUNT(CASE WHEN success = false THEN 1 END) as failed_conversions
FROM public.crm_conversion_audit 
WHERE conversion_date >= DATE_TRUNC('year', NOW() - INTERVAL '1 year')
GROUP BY DATE_TRUNC('month', conversion_date)
ORDER BY month DESC;

-- Function to refresh conversion analytics
CREATE OR REPLACE FUNCTION refresh_conversion_analytics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.crm_conversion_analytics;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 8: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get lead conversion eligibility
CREATE OR REPLACE FUNCTION check_lead_conversion_eligibility(lead_uuid UUID)
RETURNS TABLE(
    eligible BOOLEAN,
    errors TEXT[],
    warnings TEXT[]
) AS $$
DECLARE
    lead_record RECORD;
    error_list TEXT[] := '{}';
    warning_list TEXT[] := '{}';
    existing_contact_count INTEGER;
    existing_account_count INTEGER;
BEGIN
    -- Get lead record
    SELECT * INTO lead_record FROM public.crm_leads WHERE id = lead_uuid;
    
    IF NOT FOUND THEN
        error_list := array_append(error_list, 'Lead not found');
        RETURN QUERY SELECT false, error_list, warning_list;
        RETURN;
    END IF;
    
    -- Check if already converted
    IF lead_record.lead_status = 'converted' THEN
        error_list := array_append(error_list, 'Lead is already converted');
    END IF;
    
    -- Check if lost
    IF lead_record.lead_status = 'lost' THEN
        error_list := array_append(error_list, 'Cannot convert a lost lead');
    END IF;
    
    -- Check required fields
    IF lead_record.email IS NULL OR lead_record.email = '' THEN
        error_list := array_append(error_list, 'Lead must have an email address');
    END IF;
    
    IF (lead_record.first_name IS NULL OR lead_record.first_name = '') AND 
       (lead_record.last_name IS NULL OR lead_record.last_name = '') THEN
        error_list := array_append(error_list, 'Lead must have at least first name or last name');
    END IF;
    
    -- Check for existing contact with same email
    IF lead_record.email IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_contact_count 
        FROM public.crm_contacts 
        WHERE email = lead_record.email;
        
        IF existing_contact_count > 0 THEN
            warning_list := array_append(warning_list, 'Contact with this email already exists');
        END IF;
    END IF;
    
    -- Check for existing account with same name
    IF lead_record.company_name IS NOT NULL THEN
        SELECT COUNT(*) INTO existing_account_count 
        FROM public.crm_accounts 
        WHERE account_name = lead_record.company_name;
        
        IF existing_account_count > 0 THEN
            warning_list := array_append(warning_list, 'Account with this name already exists');
        END IF;
    END IF;
    
    RETURN QUERY SELECT (array_length(error_list, 1) IS NULL OR array_length(error_list, 1) = 0), error_list, warning_list;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 9: VERIFICATION AND TESTING
-- =====================================================

-- Test function to verify the conversion system
CREATE OR REPLACE FUNCTION test_conversion_system()
RETURNS TEXT AS $$
DECLARE
    test_lead_id UUID;
    test_contact_id UUID;
    test_account_id UUID;
    eligibility_result RECORD;
    result TEXT;
BEGIN
    -- Create a test lead
    INSERT INTO public.crm_leads (
        email, lead_status, lead_source, lead_type, first_name, last_name, company_name
    ) VALUES (
        'conversion-test-' || extract(epoch from now()) || '@example.com',
        'qualified', 'website', 'individual', 'Conversion', 'Test', 'Test Conversion Company'
    ) RETURNING id INTO test_lead_id;
    
    -- Test eligibility check
    SELECT * INTO eligibility_result FROM check_lead_conversion_eligibility(test_lead_id);
    
    IF NOT eligibility_result.eligible THEN
        result := 'FAILED: Lead eligibility check failed - ' || array_to_string(eligibility_result.errors, ', ');
    ELSE
        -- Test contact creation
        INSERT INTO public.crm_contacts (
            first_name, last_name, email, converted_from_lead_id
        ) VALUES (
            'Conversion', 'Test', 'conversion-test-' || extract(epoch from now()) || '@example.com', test_lead_id
        ) RETURNING id INTO test_contact_id;
        
        -- Test account creation
        INSERT INTO public.crm_accounts (
            account_name, converted_from_lead_id, primary_contact_id
        ) VALUES (
            'Test Conversion Company', test_lead_id, test_contact_id
        ) RETURNING id INTO test_account_id;
        
        -- Update contact with account
        UPDATE public.crm_contacts SET account_id = test_account_id WHERE id = test_contact_id;
        
        -- Test lead update
        UPDATE public.crm_leads SET 
            lead_status = 'converted',
            converted_contact_id = test_contact_id,
            converted_account_id = test_account_id,
            conversion_date = NOW()
        WHERE id = test_lead_id;
        
        result := 'SUCCESS: Conversion system test passed. Lead ID: ' || test_lead_id::text || 
                 ', Contact ID: ' || test_contact_id::text || 
                 ', Account ID: ' || test_account_id::text;
    END IF;
    
    -- Cleanup test data
    DELETE FROM public.crm_contacts WHERE id = test_contact_id;
    DELETE FROM public.crm_accounts WHERE id = test_account_id;
    DELETE FROM public.crm_leads WHERE id = test_lead_id;
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        -- Cleanup on error
        DELETE FROM public.crm_contacts WHERE converted_from_lead_id = test_lead_id;
        DELETE FROM public.crm_accounts WHERE converted_from_lead_id = test_lead_id;
        DELETE FROM public.crm_leads WHERE id = test_lead_id;
        
        RETURN 'ERROR: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 10: FINAL VERIFICATION
-- =====================================================

-- Run the test
SELECT test_conversion_system() as conversion_system_test_result;

-- Verify all tables exist
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename LIKE 'crm_%' 
AND schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.crm_contacts IS 'CRM contacts table storing customer contact information converted from leads';
COMMENT ON TABLE public.crm_accounts IS 'CRM accounts table storing company/organization information converted from leads';
COMMENT ON TABLE public.crm_conversion_audit IS 'Audit trail for all lead conversion operations';
COMMENT ON TABLE public.crm_conversion_rules IS 'Rules engine for automated lead conversion triggers';
COMMENT ON TABLE public.crm_trigger_log IS 'Log of all conversion trigger executions';

COMMENT ON FUNCTION check_lead_conversion_eligibility(UUID) IS 'Validates if a lead is eligible for conversion';
COMMENT ON FUNCTION test_conversion_system() IS 'Tests the complete conversion system functionality';
COMMENT ON FUNCTION refresh_conversion_analytics() IS 'Refreshes the conversion analytics materialized view';

COMMENT ON MATERIALIZED VIEW public.crm_conversion_analytics IS 'Analytics data for lead conversion performance tracking';
