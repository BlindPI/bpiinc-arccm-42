-- Create email delivery alerts table
CREATE TABLE IF NOT EXISTS public.email_delivery_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium',
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id)
);

-- Create email retry queue table
CREATE TABLE IF NOT EXISTS public.email_retry_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES public.certificates(id),
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create email delivery reports table
CREATE TABLE IF NOT EXISTS public.email_delivery_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL,
    report_type VARCHAR(20) NOT NULL DEFAULT 'daily',
    stats JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(report_date, report_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_delivery_alerts_type ON public.email_delivery_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_email_delivery_alerts_severity ON public.email_delivery_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_email_delivery_alerts_created_at ON public.email_delivery_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_email_delivery_alerts_unresolved ON public.email_delivery_alerts(created_at) WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_retry_queue_status ON public.email_retry_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_retry_queue_next_retry ON public.email_retry_queue(next_retry_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_retry_queue_certificate ON public.email_retry_queue(certificate_id);

CREATE INDEX IF NOT EXISTS idx_email_delivery_reports_date ON public.email_delivery_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_email_delivery_reports_type ON public.email_delivery_reports(report_type);

-- Enable RLS
ALTER TABLE public.email_delivery_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_retry_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_delivery_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_delivery_alerts
CREATE POLICY "email_delivery_alerts_admin_access" ON public.email_delivery_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
        )
    );

-- RLS Policies for email_retry_queue
CREATE POLICY "email_retry_queue_admin_access" ON public.email_retry_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
        )
    );

-- System can manage retry queue
CREATE POLICY "email_retry_queue_system_access" ON public.email_retry_queue
    FOR ALL USING (true);

-- RLS Policies for email_delivery_reports
CREATE POLICY "email_delivery_reports_admin_access" ON public.email_delivery_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
        )
    );

-- Create function to get domain bounce rates
CREATE OR REPLACE FUNCTION public.get_domain_bounce_rates(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
    domain TEXT,
    total_emails BIGINT,
    bounced_emails BIGINT,
    bounce_rate NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        SPLIT_PART(ede.recipient_email, '@', 2) as domain,
        COUNT(*) as total_emails,
        COUNT(*) FILTER (WHERE ede.event_type = 'bounced') as bounced_emails,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE ede.event_type = 'bounced')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0 
        END as bounce_rate
    FROM public.email_delivery_events ede
    WHERE ede.timestamp >= NOW() - (hours_back || ' hours')::INTERVAL
        AND ede.recipient_email IS NOT NULL
        AND SPLIT_PART(ede.recipient_email, '@', 2) != ''
    GROUP BY SPLIT_PART(ede.recipient_email, '@', 2)
    HAVING COUNT(*) >= 5  -- Only domains with at least 5 emails
    ORDER BY bounce_rate DESC;
END;
$$;