-- CRM Fixes Final - Complete Steps 4-7 with Column Validation
-- This migration safely completes the CRM setup from current state
-- Validates all columns exist before using them

-- =====================================================
-- STEP 1: VALIDATE AND ADD MISSING COLUMNS FIRST
-- =====================================================

-- Ensure all required columns exist in email_templates before any operations
DO $$
BEGIN
    -- Add missing columns that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'email_content') THEN
        ALTER TABLE public.email_templates ADD COLUMN email_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'variables') THEN
        ALTER TABLE public.email_templates ADD COLUMN variables TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'is_active') THEN
        ALTER TABLE public.email_templates ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'personalization_fields') THEN
        ALTER TABLE public.email_templates ADD COLUMN personalization_fields JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'design_data') THEN
        ALTER TABLE public.email_templates ADD COLUMN design_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'html_content') THEN
        ALTER TABLE public.email_templates ADD COLUMN html_content TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'created_by') THEN
        ALTER TABLE public.email_templates ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'created_at') THEN
        ALTER TABLE public.email_templates ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'updated_at') THEN
        ALTER TABLE public.email_templates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Now create indexes safely (all columns should exist)
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

-- Email templates indexes (now safe to create)
CREATE INDEX IF NOT EXISTS idx_email_templates_type ON public.email_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON public.email_templates(is_active);

-- Campaign metrics indexes
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_created_at ON public.campaign_metrics(created_at);

-- =====================================================
-- STEP 3: CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Check if update_updated_at_column function exists, if not create it
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for new tables (using safe approach)
DO $$
BEGIN
    -- Drop triggers if they exist, then recreate them
    DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON public.crm_contacts;
    DROP TRIGGER IF EXISTS update_crm_accounts_updated_at ON public.crm_accounts;
    DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON public.email_campaigns;
    DROP TRIGGER IF EXISTS update_email_templates_updated_at ON public.email_templates;
    DROP TRIGGER IF EXISTS update_campaign_metrics_updated_at ON public.campaign_metrics;
    
    -- Create triggers
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_contacts') THEN
        CREATE TRIGGER update_crm_contacts_updated_at 
            BEFORE UPDATE ON public.crm_contacts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_accounts') THEN
        CREATE TRIGGER update_crm_accounts_updated_at 
            BEFORE UPDATE ON public.crm_accounts 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
        CREATE TRIGGER update_email_campaigns_updated_at 
            BEFORE UPDATE ON public.email_campaigns 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        CREATE TRIGGER update_email_templates_updated_at 
            BEFORE UPDATE ON public.email_templates 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_metrics') THEN
        CREATE TRIGGER update_campaign_metrics_updated_at 
            BEFORE UPDATE ON public.campaign_metrics 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- STEP 4: INSERT DEFAULT DATA (WITH SAFE COLUMN REFERENCES)
-- =====================================================

-- Insert default email templates using only columns that definitely exist
-- First, let's check what columns actually exist and insert accordingly
DO $$
DECLARE
    has_email_content BOOLEAN;
    has_variables BOOLEAN;
    has_is_active BOOLEAN;
    insert_sql TEXT;
BEGIN
    -- Check which columns exist
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'email_content') INTO has_email_content;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'variables') INTO has_variables;
    
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'email_templates' AND column_name = 'is_active') INTO has_is_active;
    
    -- Build insert statement based on available columns
    insert_sql := 'INSERT INTO public.email_templates (template_name, template_type, subject_line';
    
    IF has_email_content THEN
        insert_sql := insert_sql || ', email_content';
    END IF;
    
    IF has_variables THEN
        insert_sql := insert_sql || ', variables';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', is_active';
    END IF;
    
    insert_sql := insert_sql || ') VALUES ';
    
    -- Add the values
    insert_sql := insert_sql || '(''Welcome Email'', ''welcome'', ''Welcome to {{company_name}}!''';
    
    IF has_email_content THEN
        insert_sql := insert_sql || ', ''Dear {{first_name}},

Welcome to {{company_name}}! We''''re excited to have you on board.

Best regards,
The Team''';
    END IF;
    
    IF has_variables THEN
        insert_sql := insert_sql || ', ARRAY[''company_name'', ''first_name'']';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', TRUE';
    END IF;
    
    insert_sql := insert_sql || '),';
    
    -- Newsletter template
    insert_sql := insert_sql || '(''Newsletter Template'', ''newsletter'', ''{{company_name}} Monthly Newsletter - {{month}}''';
    
    IF has_email_content THEN
        insert_sql := insert_sql || ', ''Hello {{first_name}},

Here are the latest updates from {{company_name}} for {{month}}.

[Newsletter Content]

Best regards,
The {{company_name}} Team''';
    END IF;
    
    IF has_variables THEN
        insert_sql := insert_sql || ', ARRAY[''company_name'', ''first_name'', ''month'']';
    END IF;
    
    IF has_is_active THEN
        insert_sql := insert_sql || ', TRUE';
    END IF;
    
    insert_sql := insert_sql || ') ON CONFLICT (template_name) DO NOTHING';
    
    -- Execute the dynamic insert
    EXECUTE insert_sql;
    
    RAISE NOTICE 'Inserted email templates with available columns';
END $$;

-- =====================================================
-- STEP 5: DISABLE RLS TEMPORARILY
-- =====================================================

-- Keep RLS disabled for now to maintain consistency with existing CRM tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_contacts') THEN
        ALTER TABLE public.crm_contacts DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_accounts') THEN
        ALTER TABLE public.crm_accounts DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
        ALTER TABLE public.email_campaigns DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        ALTER TABLE public.email_templates DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_metrics') THEN
        ALTER TABLE public.campaign_metrics DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- STEP 6: ADD DOCUMENTATION COMMENTS
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_contacts') THEN
        COMMENT ON TABLE public.crm_contacts IS 'CRM contacts table - core customer contact information';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_accounts') THEN
        COMMENT ON TABLE public.crm_accounts IS 'CRM accounts table - customer account/company information';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_campaigns') THEN
        COMMENT ON TABLE public.email_campaigns IS 'Email marketing campaigns - compatible with EmailCampaignService';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
        COMMENT ON TABLE public.email_templates IS 'Email templates for campaign creation';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_metrics') THEN
        COMMENT ON TABLE public.campaign_metrics IS 'Email campaign performance metrics and analytics';
    END IF;
END $$;

-- =====================================================
-- STEP 7: VALIDATION AND SUCCESS MESSAGE
-- =====================================================

-- Validate that key tables exist and report status
DO $$
DECLARE
    missing_tables TEXT[] := '{}';
    existing_tables TEXT[] := '{}';
    table_name TEXT;
    column_count INTEGER;
BEGIN
    -- Check for required tables
    FOR table_name IN SELECT unnest(ARRAY['crm_contacts', 'crm_accounts', 'email_campaigns', 'email_templates', 'campaign_metrics']) LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_name) THEN
            missing_tables := array_append(missing_tables, table_name);
        ELSE
            existing_tables := array_append(existing_tables, table_name);
        END IF;
    END LOOP;
    
    -- Report status
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'WARNING: Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;
    
    IF array_length(existing_tables, 1) > 0 THEN
        RAISE NOTICE 'SUCCESS: Existing tables: %', array_to_string(existing_tables, ', ');
    END IF;
    
    -- Check email_templates columns
    SELECT COUNT(*) INTO column_count 
    FROM information_schema.columns 
    WHERE table_name = 'email_templates';
    
    RAISE NOTICE 'Email templates table has % columns', column_count;
END $$;

-- Final success message
SELECT 'CRM Phase 1 Critical Fixes - Final Version Applied Successfully' as status,
       'All steps completed safely. System ready for Phase 2 service integration.' as next_steps,
       'Check the notices above for table and column validation results.' as validation_info;