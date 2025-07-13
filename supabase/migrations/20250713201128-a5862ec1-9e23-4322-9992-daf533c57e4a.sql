-- Create function to update user activity metrics
CREATE OR REPLACE FUNCTION public.update_user_activity_metrics(
  p_user_id uuid,
  p_activity_date date,
  p_activity_type text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert or update activity metrics for the user and date
  INSERT INTO public.user_activity_metrics (
    user_id,
    activity_date,
    activity_type,
    activity_count,
    metadata
  ) VALUES (
    p_user_id,
    p_activity_date,
    p_activity_type,
    1,
    jsonb_build_object(p_activity_type, 1)
  )
  ON CONFLICT (user_id, activity_date, activity_type) DO UPDATE SET
    activity_count = user_activity_metrics.activity_count + 1,
    metadata = user_activity_metrics.metadata || jsonb_build_object(p_activity_type, 
      COALESCE((user_activity_metrics.metadata->>p_activity_type)::integer, 0) + 1
    );
END;
$$;

-- Enable realtime for user activity tables
ALTER TABLE public.user_activity_logs REPLICA IDENTITY FULL;
ALTER TABLE public.user_activity_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_metrics;