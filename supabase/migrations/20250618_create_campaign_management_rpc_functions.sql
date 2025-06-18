-- =====================================================
-- Campaign Management RPC Functions
-- =====================================================
-- This migration creates RPC functions needed for campaign management
-- diagnostics and enhanced functionality (NO SAMPLE DATA)

-- Function to execute SQL queries for diagnostics
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow SELECT statements for security
    IF NOT (sql ILIKE 'SELECT%' OR sql ILIKE 'WITH%') THEN
        RAISE EXCEPTION 'Only SELECT statements are allowed';
    END IF;
    
    -- Execute the query and return results as JSONB
    RETURN QUERY EXECUTE format('
        SELECT to_jsonb(row) as result 
        FROM (%s) as row
    ', sql);
END;
$$;

-- Function to get campaign analytics data
CREATE OR REPLACE FUNCTION public.get_campaign_analytics(
    campaign_ids uuid[] DEFAULT NULL,
    date_from timestamp DEFAULT NULL,
    date_to timestamp DEFAULT NULL
)
RETURNS TABLE(
    campaign_id uuid,
    campaign_name text,
    campaign_type text,
    sent_count integer,
    delivered_count integer,
    opened_count integer,
    clicked_count integer,
    bounced_count integer,
    unsubscribed_count integer,
    open_rate numeric,
    click_rate numeric,
    bounce_rate numeric,
    unsubscribe_rate numeric,
    revenue_attributed numeric,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ec.id as campaign_id,
        ec.campaign_name,
        ec.campaign_type,
        COALESCE(ec.total_recipients, 0) as sent_count,
        COALESCE(ec.delivered_count, 0) as delivered_count,
        COALESCE(ec.opened_count, 0) as opened_count,
        COALESCE(ec.clicked_count, 0) as clicked_count,
        COALESCE(ec.bounced_count, 0) as bounced_count,
        COALESCE(ec.unsubscribed_count, 0) as unsubscribed_count,
        CASE 
            WHEN COALESCE(ec.delivered_count, 0) > 0 
            THEN ROUND((COALESCE(ec.opened_count, 0)::numeric / ec.delivered_count::numeric) * 100, 2)
            ELSE 0
        END as open_rate,
        CASE 
            WHEN COALESCE(ec.opened_count, 0) > 0 
            THEN ROUND((COALESCE(ec.clicked_count, 0)::numeric / ec.opened_count::numeric) * 100, 2)
            ELSE 0
        END as click_rate,
        CASE 
            WHEN COALESCE(ec.total_recipients, 0) > 0 
            THEN ROUND((COALESCE(ec.bounced_count, 0)::numeric / ec.total_recipients::numeric) * 100, 2)
            ELSE 0
        END as bounce_rate,
        CASE 
            WHEN COALESCE(ec.total_recipients, 0) > 0 
            THEN ROUND((COALESCE(ec.unsubscribed_count, 0)::numeric / ec.total_recipients::numeric) * 100, 2)
            ELSE 0
        END as unsubscribe_rate,
        COALESCE(ec.revenue_attributed, 0) as revenue_attributed,
        ec.created_at
    FROM public.email_campaigns ec
    WHERE 
        (campaign_ids IS NULL OR ec.id = ANY(campaign_ids))
        AND (date_from IS NULL OR ec.created_at >= date_from)
        AND (date_to IS NULL OR ec.created_at <= date_to)
    ORDER BY ec.created_at DESC;
END;
$$;

-- Function to get campaign performance summary
CREATE OR REPLACE FUNCTION public.get_campaign_performance_summary(
    date_from timestamp DEFAULT NULL,
    date_to timestamp DEFAULT NULL
)
RETURNS TABLE(
    total_campaigns integer,
    active_campaigns integer,
    total_recipients bigint,
    total_delivered bigint,
    total_opened bigint,
    total_clicked bigint,
    total_bounced bigint,
    total_unsubscribed bigint,
    avg_open_rate numeric,
    avg_click_rate numeric,
    avg_bounce_rate numeric,
    avg_unsubscribe_rate numeric,
    total_revenue numeric,
    performance_data jsonb,
    engagement_data jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    perf_data jsonb;
    eng_data jsonb;
BEGIN
    -- Build performance data by campaign type
    SELECT jsonb_agg(
        jsonb_build_object(
            'name', campaign_type,
            'sent', COALESCE(SUM(total_recipients), 0),
            'opened', COALESCE(SUM(opened_count), 0),
            'clicked', COALESCE(SUM(clicked_count), 0),
            'converted', COALESCE(COUNT(*) FILTER (WHERE status = 'sent'), 0)
        )
    ) INTO perf_data
    FROM public.email_campaigns
    WHERE 
        (date_from IS NULL OR created_at >= date_from)
        AND (date_to IS NULL OR created_at <= date_to)
    GROUP BY campaign_type;

    -- Build engagement data by month
    SELECT jsonb_agg(
        jsonb_build_object(
            'date', TO_CHAR(date_trunc('month', created_at), 'YYYY-MM'),
            'openRate', CASE 
                WHEN SUM(delivered_count) > 0 
                THEN ROUND((SUM(opened_count)::numeric / SUM(delivered_count)::numeric) * 100, 1)
                ELSE 0
            END,
            'clickRate', CASE 
                WHEN SUM(opened_count) > 0 
                THEN ROUND((SUM(clicked_count)::numeric / SUM(opened_count)::numeric) * 100, 1)
                ELSE 0
            END
        )
        ORDER BY date_trunc('month', created_at)
    ) INTO eng_data
    FROM public.email_campaigns
    WHERE 
        (date_from IS NULL OR created_at >= date_from)
        AND (date_to IS NULL OR created_at <= date_to)
        AND created_at >= NOW() - INTERVAL '12 months'
    GROUP BY date_trunc('month', created_at);

    -- Return summary data
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_campaigns,
        COUNT(*) FILTER (WHERE status IN ('sending', 'scheduled'))::integer as active_campaigns,
        COALESCE(SUM(total_recipients), 0) as total_recipients,
        COALESCE(SUM(delivered_count), 0) as total_delivered,
        COALESCE(SUM(opened_count), 0) as total_opened,
        COALESCE(SUM(clicked_count), 0) as total_clicked,
        COALESCE(SUM(bounced_count), 0) as total_bounced,
        COALESCE(SUM(unsubscribed_count), 0) as total_unsubscribed,
        CASE 
            WHEN SUM(delivered_count) > 0 
            THEN ROUND((SUM(opened_count)::numeric / SUM(delivered_count)::numeric) * 100, 1)
            ELSE 0
        END as avg_open_rate,
        CASE 
            WHEN SUM(opened_count) > 0 
            THEN ROUND((SUM(clicked_count)::numeric / SUM(opened_count)::numeric) * 100, 1)
            ELSE 0
        END as avg_click_rate,
        CASE 
            WHEN SUM(total_recipients) > 0 
            THEN ROUND((SUM(bounced_count)::numeric / SUM(total_recipients)::numeric) * 100, 1)
            ELSE 0
        END as avg_bounce_rate,
        CASE 
            WHEN SUM(total_recipients) > 0 
            THEN ROUND((SUM(unsubscribed_count)::numeric / SUM(total_recipients)::numeric) * 100, 1)
            ELSE 0
        END as avg_unsubscribe_rate,
        COALESCE(SUM(revenue_attributed), 0) as total_revenue,
        COALESCE(perf_data, '[]'::jsonb) as performance_data,
        COALESCE(eng_data, '[]'::jsonb) as engagement_data
    FROM public.email_campaigns
    WHERE 
        (date_from IS NULL OR created_at >= date_from)
        AND (date_to IS NULL OR created_at <= date_to);
END;
$$;

-- Function to send campaign (placeholder for real implementation)
CREATE OR REPLACE FUNCTION public.send_campaign(
    campaign_id uuid,
    send_immediately boolean DEFAULT false
)
RETURNS TABLE(
    success boolean,
    message text,
    recipients_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    campaign_record record;
    recipient_count integer := 0;
BEGIN
    -- Get campaign details
    SELECT * INTO campaign_record 
    FROM public.email_campaigns 
    WHERE id = campaign_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Campaign not found', 0;
        RETURN;
    END IF;
    
    IF campaign_record.status NOT IN ('draft', 'scheduled') THEN
        RETURN QUERY SELECT false, 'Campaign cannot be sent in current status: ' || campaign_record.status, 0;
        RETURN;
    END IF;
    
    -- Update campaign status
    IF send_immediately THEN
        UPDATE public.email_campaigns 
        SET status = 'sending', 
            send_date = NOW(),
            updated_at = NOW()
        WHERE id = campaign_id;
    ELSE
        UPDATE public.email_campaigns 
        SET status = 'scheduled',
            updated_at = NOW()
        WHERE id = campaign_id;
    END IF;
    
    -- Get recipient count (placeholder - would integrate with actual email service)
    recipient_count := COALESCE(campaign_record.total_recipients, 0);
    
    RETURN QUERY SELECT true, 'Campaign queued for sending', recipient_count;
END;
$$;

-- Function to pause/resume campaign
CREATE OR REPLACE FUNCTION public.update_campaign_status(
    campaign_id uuid,
    new_status text
)
RETURNS TABLE(
    success boolean,
    message text,
    old_status text,
    updated_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    campaign_record record;
    valid_statuses text[] := ARRAY['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'];
BEGIN
    -- Validate status
    IF new_status != ALL(valid_statuses) THEN
        RETURN QUERY SELECT false, 'Invalid status: ' || new_status, '', '';
        RETURN;
    END IF;
    
    -- Get current campaign
    SELECT * INTO campaign_record 
    FROM public.email_campaigns 
    WHERE id = campaign_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'Campaign not found', '', '';
        RETURN;
    END IF;
    
    -- Update status
    UPDATE public.email_campaigns 
    SET status = new_status,
        updated_at = NOW()
    WHERE id = campaign_id;
    
    RETURN QUERY SELECT true, 'Campaign status updated successfully', campaign_record.status, new_status;
END;
$$;

-- Function to get campaign automation triggers
CREATE OR REPLACE FUNCTION public.get_automation_triggers()
RETURNS TABLE(
    id text,
    name text,
    description text,
    event_type text,
    is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'lead_created'::text as id,
        'Lead Created'::text as name,
        'Triggered when a new lead is created in the CRM'::text as description,
        'lead.created'::text as event_type,
        true as is_active
    UNION ALL
    SELECT 
        'deal_stage_changed'::text,
        'Deal Stage Changed'::text,
        'Triggered when a deal moves to a specific stage'::text,
        'deal.stage_changed'::text,
        true
    UNION ALL
    SELECT 
        'contact_birthday'::text,
        'Contact Birthday'::text,
        'Triggered on contact birthday'::text,
        'contact.birthday'::text,
        true
    UNION ALL
    SELECT 
        'course_completed'::text,
        'Course Completed'::text,
        'Triggered when a contact completes a training course'::text,
        'course.completed'::text,
        true
    UNION ALL
    SELECT 
        'certificate_expiring'::text,
        'Certificate Expiring'::text,
        'Triggered when a certificate is about to expire'::text,
        'certificate.expiring'::text,
        true;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_analytics(uuid[], timestamp, timestamp) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_campaign_performance_summary(timestamp, timestamp) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_campaign(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_campaign_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_automation_triggers() TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.exec_sql(text) IS 'Execute SELECT queries for diagnostics (security restricted)';
COMMENT ON FUNCTION public.get_campaign_analytics(uuid[], timestamp, timestamp) IS 'Get detailed analytics data for campaigns';
COMMENT ON FUNCTION public.get_campaign_performance_summary(timestamp, timestamp) IS 'Get campaign performance summary with aggregated metrics';
COMMENT ON FUNCTION public.send_campaign(uuid, boolean) IS 'Send or schedule a campaign for delivery';
COMMENT ON FUNCTION public.update_campaign_status(uuid, text) IS 'Update campaign status (pause, resume, cancel)';
COMMENT ON FUNCTION public.get_automation_triggers() IS 'Get available automation triggers for campaign workflows';