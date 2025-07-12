-- =====================================================================================
-- COMPREHENSIVE SCHEMA FIX: Resolve Type Mismatches and Missing Tables
-- =====================================================================================
-- This migration fixes critical schema inconsistencies causing TypeScript build errors

-- Fix instructors table provider_id type mismatch (string vs number)
DO $$
BEGIN
  -- Check if instructors table exists and has provider_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'instructors' AND table_schema = 'public'
  ) THEN
    -- Check if provider_id is currently integer type
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'instructors' 
      AND column_name = 'provider_id' 
      AND data_type IN ('integer', 'bigint')
    ) THEN
      RAISE NOTICE 'Converting instructors.provider_id from integer to uuid...';
      
      -- Update the column type to uuid
      ALTER TABLE instructors ALTER COLUMN provider_id TYPE uuid USING provider_id::text::uuid;
      
      RAISE NOTICE 'Successfully converted instructors.provider_id to uuid type';
    ELSE
      RAISE NOTICE 'instructors.provider_id is already correct type or does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'instructors table does not exist - will be created if needed';
  END IF;
END $$;

-- Create email_logs table if missing
CREATE TABLE IF NOT EXISTS email_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES email_campaigns(id),
  recipient_email text NOT NULL,
  subject text,
  status text DEFAULT 'pending',
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  bounced_at timestamp with time zone,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add missing columns to email_campaigns table
DO $$
BEGIN
  -- Add sender_email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_campaigns' AND column_name = 'sender_email'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN sender_email text DEFAULT 'noreply@company.com';
  END IF;
  
  -- Add sender_name if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_campaigns' AND column_name = 'sender_name'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN sender_name text DEFAULT 'Training Company';
  END IF;
  
  -- Add subject if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_campaigns' AND column_name = 'subject'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN subject text;
  END IF;
  
  -- Add from_email if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_campaigns' AND column_name = 'from_email'
  ) THEN
    ALTER TABLE email_campaigns ADD COLUMN from_email text DEFAULT 'noreply@company.com';
  END IF;
END $$;

-- Fix email_templates table structure
DO $$
BEGIN
  -- Add missing columns to email_templates if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'name'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN category text DEFAULT 'general';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'subject_template'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN subject_template text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_templates' AND column_name = 'html_template'
  ) THEN
    ALTER TABLE email_templates ADD COLUMN html_template text;
  END IF;
END $$;

-- Fix workflow_templates table structure
DO $$
BEGIN
  -- Add missing columns to workflow_templates if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'workflow_steps'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN workflow_steps jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'version'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN version integer DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'workflow_name'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN workflow_name text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'conditional_routing'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN conditional_routing jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'escalation_rules'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN escalation_rules jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workflow_templates' AND column_name = 'sla_config'
  ) THEN
    ALTER TABLE workflow_templates ADD COLUMN sla_config jsonb DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_logs
CREATE POLICY "Admins can manage email logs" ON email_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('SA', 'AD')
    )
  );

CREATE POLICY "Users can view email logs for their campaigns" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM email_campaigns ec
      WHERE ec.id = email_logs.campaign_id
      AND ec.created_by = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON email_logs TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id ON email_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient_email ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

RAISE NOTICE '✅ SCHEMA FIX COMPLETED: All type mismatches and missing tables resolved';