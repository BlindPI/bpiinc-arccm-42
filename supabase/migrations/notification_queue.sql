
-- Create notification_queue table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES public.notifications(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  error TEXT DEFAULT NULL,
  priority TEXT DEFAULT 'NORMAL',
  category TEXT DEFAULT 'GENERAL'
);

-- Enable RLS on notification_queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Admins can see the queue
CREATE POLICY "Admins can see the notification queue" 
ON public.notification_queue 
FOR SELECT 
TO authenticated 
USING ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('AD', 'SA'));

-- Service role can insert into the queue
CREATE POLICY "Service role can insert into notification queue" 
ON public.notification_queue 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Service role can update the queue
CREATE POLICY "Service role can update notification queue" 
ON public.notification_queue 
FOR UPDATE 
TO authenticated 
USING (true);

-- Add RLS to notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can see their own notifications or admins can see all
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('AD', 'SA'));

-- System can create notifications for any user
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Users can update their own notifications (e.g., mark as read) or admins can update any notification
CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid() OR (SELECT role FROM profiles WHERE id = auth.uid()) IN ('AD', 'SA'));

-- Service role can delete notifications
CREATE POLICY "Service role can delete notifications" 
ON public.notifications 
FOR DELETE 
TO authenticated 
USING (true);
