
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

-- Fixed verify_certificate function with proper column references
CREATE OR REPLACE FUNCTION public.verify_certificate(verification_code_param text)
 RETURNS TABLE(valid boolean, certificate_id uuid, recipient_name text, course_name text, issue_date text, expiry_date text, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
BEGIN
  -- Log the verification attempt
  INSERT INTO public.certificate_verification_logs (
    verification_code,
    certificate_id,
    result
  )
  VALUES (
    verification_code_param,
    (SELECT id FROM public.certificates WHERE certificates.verification_code = verification_code_param LIMIT 1),
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.certificates WHERE certificates.verification_code = verification_code_param) THEN 'FOUND'
      ELSE 'NOT_FOUND'
    END
  );
  
  -- Return certificate information
  RETURN QUERY
  SELECT 
    (c.status = 'ACTIVE') AS valid,
    c.id,
    c.recipient_name,
    c.course_name,
    c.issue_date,
    c.expiry_date,
    c.status
  FROM 
    public.certificates c
  WHERE 
    c.verification_code = verification_code_param;
END;
$$;
