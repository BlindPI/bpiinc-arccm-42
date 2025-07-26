-- Fix the certificate generation with correct column names
DO $$
DECLARE
    cert_request_record RECORD;
    new_certificate_id UUID;
    verification_code_val TEXT;
BEGIN
    -- Generate verification code
    verification_code_val := 
        chr(65 + floor(random() * 26)) || chr(65 + floor(random() * 26)) || chr(65 + floor(random() * 26)) ||
        floor(random() * 10)::text || floor(random() * 10)::text || floor(random() * 10)::text || 
        floor(random() * 10)::text || floor(random() * 10)::text ||
        chr(65 + floor(random() * 26)) || chr(65 + floor(random() * 26));

    -- Get the certificate request record
    SELECT * INTO cert_request_record 
    FROM certificate_requests 
    WHERE id = '3a5ffca2-a369-4d1d-800c-7ba38a7ca58a';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Certificate request not found';
    END IF;

    -- Insert the certificate with correct column names
    INSERT INTO certificates (
        certificate_request_id,
        recipient_name,
        recipient_email,
        course_name,
        issue_date,
        expiry_date,
        verification_code,
        status,
        issued_by,
        created_at,
        updated_at
    ) VALUES (
        cert_request_record.id,
        cert_request_record.recipient_name,
        cert_request_record.email,
        COALESCE(cert_request_record.course_name, 'Training Certificate'),
        COALESCE(cert_request_record.completion_date::text, NOW()::date::text),
        COALESCE(cert_request_record.expiry_date::text, (NOW() + INTERVAL '2 years')::date::text),
        verification_code_val,
        'ACTIVE',
        '27d8a03f-4c78-4aac-9b6e-c4a8eb99f8f2',
        NOW(),
        NOW()
    ) RETURNING id INTO new_certificate_id;

    -- Update certificate request status
    UPDATE certificate_requests 
    SET status = 'APPROVED', updated_at = NOW() 
    WHERE id = '3a5ffca2-a369-4d1d-800c-7ba38a7ca58a';

    -- Create audit log entry
    INSERT INTO certificate_audit_logs (
        certificate_id,
        action,
        performed_by,
        reason
    ) VALUES (
        new_certificate_id,
        'CREATED',
        '27d8a03f-4c78-4aac-9b6e-c4a8eb99f8f2',
        'Direct SQL generation for missing certificate'
    );

    -- Queue notification
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        priority,
        data
    ) VALUES (
        '27d8a03f-4c78-4aac-9b6e-c4a8eb99f8f2',
        'CERTIFICATE_GENERATED',
        'Certificate Generated',
        'Certificate has been generated for ' || cert_request_record.recipient_name,
        'NORMAL',
        jsonb_build_object(
            'certificate_id', new_certificate_id,
            'verification_code', verification_code_val,
            'email', cert_request_record.email
        )
    );

    RAISE NOTICE 'Certificate created with ID: % and verification code: %', new_certificate_id, verification_code_val;
END $$;