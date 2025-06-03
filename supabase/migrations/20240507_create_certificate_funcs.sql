
-- Function to log certificate actions (audit log)
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

-- Function to log certificate verification attempts
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
  -- Get context info if available
  user_agent_text := current_setting('request.headers', true)::json->>'user-agent';
  ip_addr := current_setting('request.headers', true)::json->>'x-forwarded-for';
  
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
