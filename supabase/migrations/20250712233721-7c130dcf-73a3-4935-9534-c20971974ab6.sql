-- Create provider_settings table for AP user configuration
CREATE TABLE public.provider_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES authorized_providers(id) ON DELETE CASCADE,
    
    -- Provider Profile Settings
    display_name VARCHAR(255),
    branding_logo_url TEXT,
    branding_primary_color VARCHAR(7), -- hex color
    branding_secondary_color VARCHAR(7),
    operating_hours JSONB DEFAULT '{"mon":{"start":"09:00","end":"17:00"},"tue":{"start":"09:00","end":"17:00"},"wed":{"start":"09:00","end":"17:00"},"thu":{"start":"09:00","end":"17:00"},"fri":{"start":"09:00","end":"17:00"},"sat":null,"sun":null}'::jsonb,
    preferred_communication_method VARCHAR(50) DEFAULT 'email',
    
    -- System Preferences
    dashboard_layout JSONB DEFAULT '{"widgets":["performance","assignments","compliance"],"refresh_interval":300}'::jsonb,
    notification_preferences JSONB DEFAULT '{"email":true,"in_app":true,"frequency":"immediate"}'::jsonb,
    theme_preferences JSONB DEFAULT '{"mode":"system","compact_view":false}'::jsonb,
    language_preference VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    export_format VARCHAR(20) DEFAULT 'pdf',
    
    -- Team & Location Management Preferences
    default_assignment_role VARCHAR(50) DEFAULT 'provider',
    auto_assignment_enabled BOOLEAN DEFAULT false,
    team_naming_convention VARCHAR(100),
    location_specific_settings JSONB DEFAULT '{}'::jsonb,
    delegation_permissions JSONB DEFAULT '{"can_delegate":false,"approval_required":true}'::jsonb,
    
    -- Performance & Compliance Config
    performance_targets JSONB DEFAULT '{"completion_rate":90,"compliance_score":95}'::jsonb,
    reporting_schedule VARCHAR(50) DEFAULT 'weekly',
    compliance_reminder_days INTEGER DEFAULT 7,
    auto_reporting_enabled BOOLEAN DEFAULT true,
    
    -- Access Control & Security
    session_timeout_minutes INTEGER DEFAULT 480, -- 8 hours
    two_factor_enabled BOOLEAN DEFAULT false,
    api_access_enabled BOOLEAN DEFAULT false,
    audit_trail_retention_days INTEGER DEFAULT 365,
    
    -- Integration & Workflow Settings
    external_integrations JSONB DEFAULT '{}'::jsonb,
    workflow_triggers JSONB DEFAULT '{}'::jsonb,
    email_templates JSONB DEFAULT '{}'::jsonb,
    bulk_operation_limit INTEGER DEFAULT 100,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.provider_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own provider settings"
ON public.provider_settings
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_provider_settings_user_id ON public.provider_settings(user_id);
CREATE INDEX idx_provider_settings_provider_id ON public.provider_settings(provider_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_provider_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_settings_updated_at
    BEFORE UPDATE ON public.provider_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_provider_settings_updated_at();