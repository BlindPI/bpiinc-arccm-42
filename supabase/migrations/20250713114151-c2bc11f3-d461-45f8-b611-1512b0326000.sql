-- Phase 3B: External Integration - Database Schema

-- External calendar integrations table
CREATE TABLE IF NOT EXISTS public.external_calendar_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_type VARCHAR(50) CHECK (provider_type IN ('google', 'outlook', 'office365')) NOT NULL,
    provider_email VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true NOT NULL,
    sync_settings JSONB DEFAULT '{"sync_availability": true, "sync_conflicts": true, "auto_create_events": false}'::jsonb,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(50) DEFAULT 'active' CHECK (sync_status IN ('active', 'error', 'expired', 'disabled')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, provider_type, provider_email)
);

-- Calendar sync events tracking
CREATE TABLE IF NOT EXISTS public.calendar_sync_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    integration_id UUID REFERENCES public.external_calendar_integrations(id) ON DELETE CASCADE NOT NULL,
    availability_booking_id UUID REFERENCES public.availability_bookings(id) ON DELETE CASCADE,
    external_event_id VARCHAR(255) NOT NULL,
    external_calendar_id VARCHAR(255),
    event_title VARCHAR(255),
    event_start TIMESTAMP WITH TIME ZONE NOT NULL,
    event_end TIMESTAMP WITH TIME ZONE NOT NULL,
    sync_direction VARCHAR(20) CHECK (sync_direction IN ('import', 'export', 'bidirectional')) DEFAULT 'bidirectional',
    sync_status VARCHAR(50) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'conflict', 'error', 'pending')),
    conflict_data JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(integration_id, external_event_id)
);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type VARCHAR(100) NOT NULL, -- 'availability_change', 'calendar_conflict', 'team_update', etc.
    enabled BOOLEAN DEFAULT true NOT NULL,
    delivery_method VARCHAR(50) CHECK (delivery_method IN ('email', 'sms', 'push', 'webhook')) NOT NULL,
    delivery_address VARCHAR(255), -- email address, phone number, webhook URL
    settings JSONB DEFAULT '{}'::jsonb, -- timing, frequency, conditions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id, notification_type, delivery_method)
);

-- Notification delivery log
CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    delivery_address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
    message_id VARCHAR(255), -- external service message ID
    content_summary TEXT,
    error_message TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Webhook configurations
CREATE TABLE IF NOT EXISTS public.webhook_configurations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    webhook_name VARCHAR(255) NOT NULL,
    event_types TEXT[] NOT NULL, -- ['availability_change', 'team_update', 'booking_created']
    is_active BOOLEAN DEFAULT true NOT NULL,
    secret_key VARCHAR(255), -- for webhook signature verification
    headers JSONB DEFAULT '{}'::jsonb, -- custom headers
    retry_config JSONB DEFAULT '{"max_retries": 3, "retry_delay": 300}'::jsonb,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CHECK (user_id IS NOT NULL OR team_id IS NOT NULL)
);

-- Calendar import/export operations
CREATE TABLE IF NOT EXISTS public.calendar_operations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    operation_type VARCHAR(50) CHECK (operation_type IN ('import', 'export', 'bulk_sync')) NOT NULL,
    file_name VARCHAR(255),
    file_path TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    processed_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    error_log JSONB DEFAULT '[]'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for all new tables
ALTER TABLE public.external_calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_sync_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_operations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_calendar_integrations
CREATE POLICY "Users can manage their own calendar integrations"
ON public.external_calendar_integrations
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for calendar_sync_events
CREATE POLICY "Users can view their calendar sync events"
ON public.calendar_sync_events
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.external_calendar_integrations eci
        WHERE eci.id = calendar_sync_events.integration_id
        AND eci.user_id = auth.uid()
    )
);

CREATE POLICY "System can manage calendar sync events"
ON public.calendar_sync_events
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.external_calendar_integrations eci
        WHERE eci.id = calendar_sync_events.integration_id
        AND eci.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.external_calendar_integrations eci
        WHERE eci.id = calendar_sync_events.integration_id
        AND eci.user_id = auth.uid()
    )
);

-- RLS Policies for notification_preferences
CREATE POLICY "Users can manage their notification preferences"
ON public.notification_preferences
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for notification_delivery_log
CREATE POLICY "Users can view their notification logs"
ON public.notification_delivery_log
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create notification logs"
ON public.notification_delivery_log
FOR INSERT
WITH CHECK (true);

-- RLS Policies for webhook_configurations
CREATE POLICY "Users can manage their webhooks"
ON public.webhook_configurations
FOR ALL
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = webhook_configurations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'ADMIN'
    )
)
WITH CHECK (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = webhook_configurations.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'ADMIN'
    )
);

-- RLS Policies for calendar_operations
CREATE POLICY "Users can manage their calendar operations"
ON public.calendar_operations
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_calendar_integrations_user_provider 
ON public.external_calendar_integrations(user_id, provider_type);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_events_integration_external 
ON public.calendar_sync_events(integration_id, external_event_id);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_type 
ON public.notification_preferences(user_id, notification_type);

CREATE INDEX IF NOT EXISTS idx_notification_delivery_log_user_created 
ON public.notification_delivery_log(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_configurations_active 
ON public.webhook_configurations(is_active, event_types);

CREATE INDEX IF NOT EXISTS idx_calendar_operations_status 
ON public.calendar_operations(status, created_at);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_external_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_external_calendar_integrations_updated_at
    BEFORE UPDATE ON public.external_calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_external_integrations_updated_at();

CREATE TRIGGER update_calendar_sync_events_updated_at
    BEFORE UPDATE ON public.calendar_sync_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_external_integrations_updated_at();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_external_integrations_updated_at();

CREATE TRIGGER update_webhook_configurations_updated_at
    BEFORE UPDATE ON public.webhook_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_external_integrations_updated_at();