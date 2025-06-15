
-- Create email campaigns table for CRM functionality
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_name VARCHAR(255) NOT NULL,
  campaign_type VARCHAR(50) NOT NULL CHECK (campaign_type IN ('newsletter', 'promotional', 'drip', 'event', 'follow_up')),
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  subject_line TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  reply_to_email VARCHAR(255),
  target_audience JSONB DEFAULT '{}',
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
  automation_rules JSONB DEFAULT '{}',
  tracking_enabled BOOLEAN DEFAULT true
);

-- Create email templates table
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL,
  subject_line TEXT NOT NULL,
  content TEXT NOT NULL,
  html_content TEXT,
  variables TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create campaign metrics table
CREATE TABLE IF NOT EXISTS public.campaign_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for email_campaigns
CREATE POLICY "Users can view their own campaigns" ON public.email_campaigns
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own campaigns" ON public.email_campaigns
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own campaigns" ON public.email_campaigns
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own campaigns" ON public.email_campaigns
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for email_templates
CREATE POLICY "Users can view email templates" ON public.email_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can create email templates" ON public.email_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for campaign_metrics
CREATE POLICY "Users can view campaign metrics" ON public.campaign_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.email_campaigns 
      WHERE email_campaigns.id = campaign_metrics.campaign_id 
      AND email_campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "System can manage campaign metrics" ON public.campaign_metrics
  FOR ALL USING (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON public.email_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON public.email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_send_date ON public.email_campaigns(send_date);
CREATE INDEX IF NOT EXISTS idx_campaign_metrics_campaign_id ON public.campaign_metrics(campaign_id);
