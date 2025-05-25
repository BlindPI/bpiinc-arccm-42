-- Notification System Upgrade Migration
-- This migration enhances the existing notification system with:
-- 1. Improved notification types and categories
-- 2. User notification preferences
-- 3. Better notification prioritization
-- 4. Email delivery rules

-- First, let's create a notification_types table to define all possible notification types
CREATE TABLE IF NOT EXISTS public.notification_types (
    id VARCHAR(50) PRIMARY KEY,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    default_priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    requires_email BOOLEAN NOT NULL DEFAULT false,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for notification_types
ALTER TABLE public.notification_types ENABLE ROW LEVEL SECURITY;

-- Everyone can read notification types
CREATE POLICY "Anyone can read notification types" 
ON public.notification_types 
FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can modify notification types
CREATE POLICY "Only admins can insert notification types" 
ON public.notification_types 
FOR INSERT 
TO authenticated 
WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('AD', 'SA'));

CREATE POLICY "Only admins can update notification types" 
ON public.notification_types 
FOR UPDATE 
TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('AD', 'SA'));

-- Enhance the existing notification_preferences table
ALTER TABLE IF EXISTS public.notification_preferences 
ADD COLUMN IF NOT EXISTS notification_type_id VARCHAR(50) REFERENCES public.notification_types(id),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER set_updated_at_notification_types
BEFORE UPDATE ON public.notification_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_notification_preferences
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a trigger to update the updated_at column on notifications table
CREATE TRIGGER set_updated_at_notifications
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add a badge_count column to notifications to track the number of related items
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS badge_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_dismissed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create a function to handle notification grouping
CREATE OR REPLACE FUNCTION handle_notification_grouping()
RETURNS TRIGGER AS $$
DECLARE
    existing_notification_id UUID;
    existing_badge_count INTEGER;
BEGIN
    -- Check if there's a similar unread notification from the last 24 hours
    SELECT id, badge_count INTO existing_notification_id, existing_badge_count
    FROM public.notifications
    WHERE user_id = NEW.user_id
      AND type = NEW.type
      AND category = NEW.category
      AND read = FALSE
      AND is_dismissed = FALSE
      AND created_at > (now() - interval '24 hours')
      -- Only group notifications without action URLs or with the same action URL
      AND (
          (action_url IS NULL AND NEW.action_url IS NULL) OR
          (action_url = NEW.action_url)
      )
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If a similar notification exists, update it instead of creating a new one
    IF existing_notification_id IS NOT NULL THEN
        -- Update the existing notification
        UPDATE public.notifications
        SET badge_count = badge_count + 1,
            title = CASE 
                WHEN badge_count = 1 THEN NEW.title
                ELSE regexp_replace(title, '^\(\d+\) ', '') -- Remove existing count if present
                END,
            message = CASE
                WHEN badge_count = 1 THEN NEW.message
                ELSE NEW.message -- Use the latest message
                END,
            updated_at = now()
        WHERE id = existing_notification_id;
        
        -- Return NULL to prevent the new notification from being inserted
        RETURN NULL;
    END IF;
    
    -- Otherwise, proceed with the insert
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for notification grouping
DROP TRIGGER IF EXISTS group_similar_notifications ON public.notifications;
CREATE TRIGGER group_similar_notifications
BEFORE INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION handle_notification_grouping();

-- Create a table for notification badges on pages/tabs
CREATE TABLE IF NOT EXISTS public.notification_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    page_path VARCHAR(255) NOT NULL,
    badge_count INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, page_path)
);

-- Add RLS policies for notification_badges
ALTER TABLE public.notification_badges ENABLE ROW LEVEL SECURITY;

-- Users can only see their own badges
CREATE POLICY "Users can view their own notification badges" 
ON public.notification_badges 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Users can only update their own badges
CREATE POLICY "Users can update their own notification badges" 
ON public.notification_badges 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- System can create badges for any user
CREATE POLICY "System can create notification badges" 
ON public.notification_badges 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Create a function to update notification badges when notifications are created
CREATE OR REPLACE FUNCTION update_notification_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_path VARCHAR(255);
BEGIN
    -- Extract the page path from the action_url or metadata
    IF NEW.action_url IS NOT NULL THEN
        -- Extract path from URL (this is a simplified version, might need adjustment)
        badge_path := regexp_replace(NEW.action_url, '^https?://[^/]+', '');
        badge_path := regexp_replace(badge_path, '\\?.*$', '');
    ELSIF NEW.metadata ? 'page_path' THEN
        badge_path := NEW.metadata->>'page_path';
    ELSE
        -- No specific page, don't create a badge
        RETURN NEW;
    END IF;
    
    -- Update or insert the badge count
    INSERT INTO public.notification_badges (user_id, page_path, badge_count)
    VALUES (NEW.user_id, badge_path, 1)
    ON CONFLICT (user_id, page_path) 
    DO UPDATE SET 
        badge_count = notification_badges.badge_count + 1,
        last_updated = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update badges when notifications are created
CREATE TRIGGER update_badges_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION update_notification_badges();

-- Create a function to clear badges when notifications are read
CREATE OR REPLACE FUNCTION clear_notification_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_path VARCHAR(255);
BEGIN
    -- Only proceed if the notification is being marked as read
    IF OLD.read = FALSE AND NEW.read = TRUE THEN
        -- Extract the page path from the action_url or metadata
        IF NEW.action_url IS NOT NULL THEN
            -- Extract path from URL
            badge_path := regexp_replace(NEW.action_url, '^https?://[^/]+', '');
            badge_path := regexp_replace(badge_path, '\\?.*$', '');
            
            -- Reduce the badge count
            UPDATE public.notification_badges
            SET badge_count = GREATEST(0, badge_count - 1),
                last_updated = now()
            WHERE user_id = NEW.user_id AND page_path = badge_path;
        ELSIF NEW.metadata ? 'page_path' THEN
            badge_path := NEW.metadata->>'page_path';
            
            -- Reduce the badge count
            UPDATE public.notification_badges
            SET badge_count = GREATEST(0, badge_count - 1),
                last_updated = now()
            WHERE user_id = NEW.user_id AND page_path = badge_path;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to clear badges when notifications are read
CREATE TRIGGER clear_badges_on_read
AFTER UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION clear_notification_badges();

-- Create a table for notification digests
CREATE TABLE IF NOT EXISTS public.notification_digests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    digest_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly'
    last_sent_at TIMESTAMP WITH TIME ZONE,
    next_scheduled_at TIMESTAMP WITH TIME ZONE,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, digest_type)
);

-- Add RLS policies for notification_digests
ALTER TABLE public.notification_digests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own digests
CREATE POLICY "Users can view their own notification digests" 
ON public.notification_digests 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- System can manage digests
CREATE POLICY "System can manage notification digests" 
ON public.notification_digests 
FOR ALL 
TO authenticated 
USING (true);

-- Create a trigger for updated_at on notification_digests
CREATE TRIGGER set_updated_at_notification_digests
BEFORE UPDATE ON public.notification_digests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Populate the notification_types table with default values
INSERT INTO public.notification_types (id, display_name, description, icon, default_priority, requires_email, category)
VALUES
    -- System notifications
    ('system_alert', 'System Alert', 'Critical system alerts that require immediate attention', 'alert-triangle', 'high', true, 'SYSTEM'),
    ('system_maintenance', 'System Maintenance', 'Scheduled maintenance notifications', 'tool', 'normal', true, 'SYSTEM'),
    ('system_update', 'System Update', 'Updates about new features or changes', 'refresh-cw', 'normal', false, 'SYSTEM'),
    
    -- Certificate notifications
    ('certificate_request', 'Certificate Request', 'New certificate request submitted', 'file-text', 'normal', true, 'CERTIFICATE'),
    ('certificate_approved', 'Certificate Approved', 'Certificate request approved', 'check-circle', 'high', true, 'CERTIFICATE'),
    ('certificate_rejected', 'Certificate Rejected', 'Certificate request rejected', 'x-circle', 'high', true, 'CERTIFICATE'),
    ('certificate_expiring', 'Certificate Expiring', 'Certificate is about to expire', 'clock', 'high', true, 'CERTIFICATE'),
    ('certificate_expired', 'Certificate Expired', 'Certificate has expired', 'alert-circle', 'normal', false, 'CERTIFICATE'),
    
    -- Course notifications
    ('course_scheduled', 'Course Scheduled', 'New course has been scheduled', 'calendar', 'normal', true, 'COURSE'),
    ('course_updated', 'Course Updated', 'Course details have been updated', 'edit', 'normal', false, 'COURSE'),
    ('course_cancelled', 'Course Cancelled', 'Course has been cancelled', 'x', 'high', true, 'COURSE'),
    ('course_reminder', 'Course Reminder', 'Reminder about upcoming course', 'bell', 'normal', true, 'COURSE'),
    
    -- Account notifications
    ('account_created', 'Account Created', 'New account has been created', 'user-plus', 'normal', true, 'ACCOUNT'),
    ('account_updated', 'Account Updated', 'Account details have been updated', 'user', 'low', false, 'ACCOUNT'),
    ('password_reset', 'Password Reset', 'Password reset request', 'lock', 'high', true, 'ACCOUNT'),
    ('login_alert', 'Login Alert', 'Unusual login activity detected', 'shield', 'high', true, 'ACCOUNT'),
    
    -- Role management notifications
    ('role_assigned', 'Role Assigned', 'New role has been assigned', 'users', 'normal', true, 'ROLE_MANAGEMENT'),
    ('role_removed', 'Role Removed', 'Role has been removed', 'user-minus', 'normal', true, 'ROLE_MANAGEMENT'),
    ('permission_changed', 'Permission Changed', 'Permissions have been changed', 'shield', 'normal', false, 'ROLE_MANAGEMENT'),
    
    -- Supervision notifications
    ('supervision_request', 'Supervision Request', 'New supervision request', 'user-check', 'normal', true, 'SUPERVISION'),
    ('supervision_approved', 'Supervision Approved', 'Supervision request approved', 'check', 'normal', true, 'SUPERVISION'),
    ('supervision_rejected', 'Supervision Rejected', 'Supervision request rejected', 'x', 'normal', true, 'SUPERVISION'),
    ('supervision_ended', 'Supervision Ended', 'Supervision relationship ended', 'user-x', 'normal', true, 'SUPERVISION'),
    
    -- Instructor notifications
    ('instructor_assigned', 'Instructor Assigned', 'Assigned as instructor to a course', 'briefcase', 'high', true, 'INSTRUCTOR'),
    ('instructor_removed', 'Instructor Removed', 'Removed as instructor from a course', 'briefcase-off', 'normal', true, 'INSTRUCTOR'),
    ('instructor_certification_expiring', 'Certification Expiring', 'Instructor certification is about to expire', 'alert-circle', 'high', true, 'INSTRUCTOR'),
    
    -- Provider notifications
    ('provider_approval_needed', 'Approval Needed', 'Provider approval needed for action', 'clipboard-check', 'high', true, 'PROVIDER'),
    ('provider_report_available', 'Report Available', 'New provider report is available', 'file-text', 'normal', true, 'PROVIDER'),
    ('provider_status_change', 'Status Change', 'Provider status has changed', 'refresh-cw', 'normal', true, 'PROVIDER')
ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    default_priority = EXCLUDED.default_priority,
    requires_email = EXCLUDED.requires_email,
    category = EXCLUDED.category,
    updated_at = now();

-- Create default notification preferences for existing users
INSERT INTO public.notification_preferences (user_id, notification_type_id, in_app_enabled, email_enabled, browser_enabled)
SELECT 
    u.id, 
    nt.id, 
    true, -- in_app_enabled
    nt.requires_email, -- email_enabled based on notification type
    false -- browser_enabled
FROM 
    auth.users u
CROSS JOIN 
    public.notification_types nt
LEFT JOIN 
    public.notification_preferences np ON u.id = np.user_id AND nt.id = np.notification_type_id
WHERE 
    np.id IS NULL -- Only insert if preference doesn't already exist
ON CONFLICT (user_id, category) DO NOTHING; -- Skip if there's a conflict on the existing unique constraint

-- Create a function to set up default notification preferences for new users
CREATE OR REPLACE FUNCTION setup_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default preferences for all notification types
    INSERT INTO public.notification_preferences (user_id, notification_type_id, in_app_enabled, email_enabled, browser_enabled)
    SELECT 
        NEW.id, 
        nt.id, 
        true, -- in_app_enabled
        nt.requires_email, -- email_enabled based on notification type
        false -- browser_enabled
    FROM 
        public.notification_types nt;
    
    -- Set up default digest preferences
    INSERT INTO public.notification_digests (user_id, digest_type, next_scheduled_at)
    VALUES 
        (NEW.id, 'daily', (now() + interval '1 day')::date + interval '8 hours'),
        (NEW.id, 'weekly', (date_trunc('week', now()) + interval '1 week' + interval '9 hours')::timestamp);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set up notification preferences for new users
DROP TRIGGER IF EXISTS setup_user_notification_preferences ON auth.users;
CREATE TRIGGER setup_user_notification_preferences
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION setup_default_notification_preferences();

-- Add a function to get unread notification counts by page
CREATE OR REPLACE FUNCTION get_notification_badges(p_user_id UUID)
RETURNS TABLE (
    page_path VARCHAR,
    badge_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT nb.page_path, nb.badge_count
    FROM public.notification_badges nb
    WHERE nb.user_id = p_user_id
    AND nb.badge_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Add a function to mark all notifications as read for a specific page
CREATE OR REPLACE FUNCTION mark_page_notifications_as_read(p_user_id UUID, p_page_path VARCHAR)
RETURNS VOID AS $$
BEGIN
    -- Mark notifications with this page path as read
    UPDATE public.notifications
    SET read = TRUE, read_at = now()
    WHERE user_id = p_user_id
    AND read = FALSE
    AND (
        (action_url IS NOT NULL AND action_url LIKE '%' || p_page_path || '%')
        OR
        (metadata ? 'page_path' AND metadata->>'page_path' = p_page_path)
    );
    
    -- Reset the badge count
    UPDATE public.notification_badges
    SET badge_count = 0, last_updated = now()
    WHERE user_id = p_user_id AND page_path = p_page_path;
END;
$$ LANGUAGE plpgsql;