-- Create missing CRM tables for full functionality
-- This migration adds the tables needed for the CRM system to work with real data

-- Campaign Settings Table
CREATE TABLE IF NOT EXISTS campaign_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  default_from_name TEXT NOT NULL DEFAULT 'Training Company',
  default_from_email TEXT NOT NULL DEFAULT 'noreply@trainingcompany.com',
  default_reply_to TEXT NOT NULL DEFAULT 'support@trainingcompany.com',
  enable_tracking BOOLEAN NOT NULL DEFAULT true,
  enable_auto_unsubscribe BOOLEAN NOT NULL DEFAULT true,
  send_time_optimization BOOLEAN NOT NULL DEFAULT false,
  max_send_rate INTEGER NOT NULL DEFAULT 1000,
  timezone_handling TEXT NOT NULL DEFAULT 'sender',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table (if not exists)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('newsletter', 'promotional', 'drip', 'event', 'follow_up')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  subject_line TEXT NOT NULL,
  content TEXT,
  html_content TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  reply_to_email TEXT,
  target_audience JSONB DEFAULT '{}',
  send_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  opportunities_created INTEGER DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  automation_rules JSONB DEFAULT '{}',
  tracking_enabled BOOLEAN DEFAULT true,
  scheduled_date TEXT,
  sent_date TEXT,
  geographic_targeting TEXT[],
  industry_targeting TEXT[],
  email_content TEXT,
  target_segments JSONB DEFAULT '{}',
  personalization_fields JSONB DEFAULT '{}',
  email_template_id TEXT,
  campaign_cost DECIMAL(10,2) DEFAULT 0
);

-- Email Templates Table (if not exists)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Campaign Metrics Table (if not exists)
CREATE TABLE IF NOT EXISTS campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automation Rules Table (if not exists)
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('progression', 'notification', 'compliance', 'certificate')),
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  execution_count INTEGER DEFAULT 0,
  last_executed TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Automation Executions Table (if not exists)
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES automation_rules(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_data JSONB DEFAULT '{}',
  result JSONB,
  error_message TEXT
);

-- Insert default campaign settings
INSERT INTO campaign_settings (id, default_from_name, default_from_email, default_reply_to)
VALUES ('default', 'Training Company', 'noreply@trainingcompany.com', 'support@trainingcompany.com')
ON CONFLICT (id) DO NOTHING;

-- Insert some default email templates
INSERT INTO email_templates (template_name, template_type, subject_line, content, variables, created_by)
VALUES
  ('Welcome Email', 'welcome', 'Welcome to {{company_name}}!', 'Thank you for joining us, {{first_name}}!', ARRAY['company_name', 'first_name'], '00000000-0000-0000-0000-000000000000'),
  ('Newsletter', 'newsletter', 'Monthly Newsletter - {{month}}', 'Here are the latest updates...', ARRAY['month'], '00000000-0000-0000-0000-000000000000'),
  ('Training Promotion', 'promotional', 'New Training Program: {{program_name}}', 'We are excited to announce our new training program...', ARRAY['program_name', 'start_date'], '00000000-0000-0000-0000-000000000000')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_at ON email_campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON campaign_metrics(campaign_id);

-- Enable RLS (Row Level Security) on tables
ALTER TABLE campaign_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow authenticated users to access)
CREATE POLICY "Allow authenticated users to access campaign_settings" ON campaign_settings
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access email_campaigns" ON email_campaigns
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access email_templates" ON email_templates
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access campaign_metrics" ON campaign_metrics
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access automation_rules" ON automation_rules
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to access automation_executions" ON automation_executions
  FOR ALL USING (auth.role() = 'authenticated');