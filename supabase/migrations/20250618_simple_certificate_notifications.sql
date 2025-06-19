-- Simple Certificate Notification System
-- Clean replacement for the overly complex notification system
-- Focus: Certificate batch upload workflows only

-- Drop existing complex notification system components
DROP TRIGGER IF EXISTS group_similar_notifications ON public.notifications;
DROP TRIGGER IF EXISTS update_badges_on_notification ON public.notifications;
DROP TRIGGER IF EXISTS clear_badges_on_read ON public.notifications;
DROP TRIGGER IF EXISTS set_updated_at_notifications ON public.notifications;
DROP TRIGGER IF EXISTS set_updated_at_notification_types ON public.notification_types;
DROP TRIGGER IF EXISTS set_updated_at_notification_preferences ON public.notification_preferences;
DROP TRIGGER IF EXISTS set_updated_at_notification_digests ON public.notification_digests;
DROP TRIGGER IF EXISTS setup_user_notification_preferences ON auth.users;

DROP FUNCTION IF EXISTS handle_notification_grouping();
DROP FUNCTION IF EXISTS update_notification_badges();
DROP FUNCTION IF EXISTS clear_notification_badges();
DROP FUNCTION IF EXISTS setup_default_notification_preferences();
DROP FUNCTION IF EXISTS get_notification_badges(UUID);
DROP FUNCTION IF EXISTS mark_page_notifications_as_read(UUID, VARCHAR);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop complex tables
DROP TABLE IF EXISTS public.notification_badges CASCADE;
DROP TABLE IF EXISTS public.notification_digests CASCADE;
DROP TABLE IF EXISTS public.notification_queue CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.notification_types CASCADE;

-- Create simple certificate notifications table
CREATE TABLE IF NOT EXISTS public.certificate_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    certificate_request_id UUID REFERENCES public.certificate_requests(id) ON DELETE CASCADE,
    batch_id UUID NULL, -- For batch operations
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'batch_submitted',
        'batch_approved', 
        'batch_rejected',
        'certificate_approved',
        'certificate_rejected'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP WITH TIME ZONE NULL,
    read_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Simple indexes for performance
    INDEX idx_certificate_notifications_user_id (user_id),
    INDEX idx_certificate_notifications_batch_id (batch_id),
    INDEX idx_certificate_notifications_type (notification_type),
    INDEX idx_certificate_notifications_created_at (created_at)
);

-- Enable RLS
ALTER TABLE public.certificate_notifications ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Users can view their own certificate notifications" 
ON public.certificate_notifications 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "System can create certificate notifications" 
ON public.certificate_notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can update their own certificate notifications" 
ON public.certificate_notifications 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Simple function to create certificate notification
CREATE OR REPLACE FUNCTION create_certificate_notification(
    p_user_id UUID,
    p_certificate_request_id UUID DEFAULT NULL,
    p_batch_id UUID DEFAULT NULL,
    p_notification_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_send_email BOOLEAN DEFAULT TRUE
) RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    user_email TEXT;
    user_name TEXT;
BEGIN
    -- Insert notification
    INSERT INTO public.certificate_notifications (
        user_id,
        certificate_request_id,
        batch_id,
        notification_type,
        title,
        message
    ) VALUES (
        p_user_id,
        p_certificate_request_id,
        p_batch_id,
        p_notification_type,
        p_title,
        p_message
    ) RETURNING id INTO notification_id;
    
    -- Send email if requested
    IF p_send_email THEN
        -- Get user details
        SELECT email, display_name INTO user_email, user_name
        FROM public.profiles 
        WHERE id = p_user_id;
        
        IF user_email IS NOT NULL THEN
            -- Call edge function to send email
            PERFORM net.http_post(
                url := current_setting('app.supabase_url') || '/functions/v1/send-certificate-notification-email',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
                ),
                body := jsonb_build_object(
                    'notification_id', notification_id,
                    'user_email', user_email,
                    'user_name', COALESCE(user_name, 'User'),
                    'title', p_title,
                    'message', p_message,
                    'notification_type', p_notification_type
                )
            );
            
            -- Mark email as sent
            UPDATE public.certificate_notifications 
            SET email_sent = TRUE, email_sent_at = now()
            WHERE id = notification_id;
        END IF;
    END IF;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to mark notification as read
CREATE OR REPLACE FUNCTION mark_certificate_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.certificate_notifications 
    SET read_at = now()
    WHERE id = p_notification_id 
    AND user_id = auth.uid()
    AND read_at IS NULL;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simple function to get unread count
CREATE OR REPLACE FUNCTION get_unread_certificate_notifications_count(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.certificate_notifications
        WHERE user_id = p_user_id
        AND read_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.certificate_notifications TO authenticated;
GRANT EXECUTE ON FUNCTION create_certificate_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_certificate_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_certificate_notifications_count TO authenticated;