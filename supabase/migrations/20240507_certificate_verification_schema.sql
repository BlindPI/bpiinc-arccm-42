
-- Create or replace the function to log certificate verification attempts
CREATE OR REPLACE FUNCTION public.log_certificate_verification(
  cert_id UUID,
  verification_code_text TEXT,
  result_status TEXT,
  reason_text TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_agent_text TEXT;
  ip_addr TEXT;
BEGIN
  -- Try to get context info if available
  BEGIN
    user_agent_text := current_setting('request.headers', true)::json->>'user-agent';
    ip_addr := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION WHEN OTHERS THEN
    -- Silently ignore if settings are not available
    user_agent_text := null;
    ip_addr := null;
  END;
  
  INSERT INTO public.certificate_verification_logs(
    certificate_id,
    verification_code,
    result,
    reason,
    ip_address,
    user_agent
  ) VALUES (
    cert_id,
    verification_code_text,
    result_status,
    reason_text,
    ip_addr,
    user_agent_text
  );
END;
$$;

-- Create or replace the function to log certificate actions
CREATE OR REPLACE FUNCTION public.log_certificate_action(
  certificate_id UUID,
  action_type TEXT,
  reason_text TEXT DEFAULT NULL,
  user_id UUID DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.certificate_audit_logs(
    certificate_id,
    action,
    reason,
    performed_by
  ) VALUES (
    certificate_id,
    action_type,
    reason_text,
    COALESCE(user_id, auth.uid())
  );
END;
$$;

-- Add RLS policies for the certificate audit logs
ALTER TABLE public.certificate_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all certificate audit logs
CREATE POLICY "Admins can view certificate audit logs" 
ON public.certificate_audit_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('SA', 'AD')
  )
);

-- Allow system to create audit logs
CREATE POLICY "System can create certificate audit logs" 
ON public.certificate_audit_logs
FOR INSERT 
WITH CHECK (true);

-- Add RLS policies for the certificate verification logs
ALTER TABLE public.certificate_verification_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to view all certificate verification logs
CREATE POLICY "Admins can view certificate verification logs" 
ON public.certificate_verification_logs
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('SA', 'AD')
  )
);

-- Allow system to create verification logs
CREATE POLICY "System can create certificate verification logs" 
ON public.certificate_verification_logs
FOR INSERT 
WITH CHECK (true);
