-- Fix upload_compliance_document function to make expiry_date optional
CREATE OR REPLACE FUNCTION upload_compliance_document(
    p_user_id UUID,
    p_metric_id UUID,
    p_file_name TEXT,
    p_file_path TEXT,
    p_file_type TEXT,
    p_file_size BIGINT,
    p_expiry_date DATE DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_document_id UUID;
    v_requires_expiry BOOLEAN;
BEGIN
    -- Check if this document type requires expiry date
    SELECT COALESCE(cdr.requires_expiry_date, false) INTO v_requires_expiry
    FROM compliance_document_requirements cdr 
    WHERE cdr.metric_id = p_metric_id;
    
    -- If no requirements found, default to not requiring expiry
    IF v_requires_expiry IS NULL THEN
        v_requires_expiry := false;
    END IF;
    
    -- Only enforce expiry date if specifically required AND not provided
    IF v_requires_expiry AND p_expiry_date IS NULL THEN
        RAISE EXCEPTION 'Expiry date is required for this document type';
    END IF;
    
    -- Insert the document
    INSERT INTO compliance_documents (
        id,
        user_id,
        metric_id,
        file_name,
        file_path,
        file_type,
        file_size,
        expiry_date,
        verification_status,
        is_current,
        upload_date,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_metric_id,
        p_file_name,
        p_file_path,
        p_file_type,
        p_file_size,
        p_expiry_date,
        'pending',
        true,
        NOW(),
        NOW(),
        NOW()
    ) RETURNING id INTO v_document_id;
    
    -- Update or create compliance record
    INSERT INTO user_compliance_records (
        id,
        user_id,
        metric_id,
        current_value,
        compliance_status,
        completion_percentage,
        last_checked_at,
        primary_document_id,
        document_count,
        tier,
        priority,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        p_user_id,
        p_metric_id,
        'true',
        'pending',
        50, -- Pending review
        NOW(),
        v_document_id,
        1,
        'basic',
        1,
        NOW(),
        NOW()
    ) ON CONFLICT (user_id, metric_id) 
    DO UPDATE SET 
        primary_document_id = v_document_id,
        document_count = user_compliance_records.document_count + 1,
        compliance_status = 'pending',
        last_checked_at = NOW(),
        updated_at = NOW();
    
    RETURN v_document_id;
    
END;
$$ LANGUAGE plpgsql;