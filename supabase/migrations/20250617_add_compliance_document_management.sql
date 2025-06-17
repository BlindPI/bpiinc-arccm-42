-- Compliance Document Management System
-- Handles file uploads, document verification, and compliance resolution

-- =============================================================================
-- STEP 1: Create Compliance Documents Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    metric_id UUID NOT NULL REFERENCES public.compliance_metrics(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expiry_date DATE,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'expired')),
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_notes TEXT,
    rejection_reason TEXT,
    is_current BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 2: Create Document Requirements Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.compliance_document_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_id UUID NOT NULL REFERENCES public.compliance_metrics(id) ON DELETE CASCADE,
    document_type VARCHAR(100) NOT NULL, -- 'certificate', 'license', 'training_record', 'insurance', etc.
    required_file_types TEXT[] DEFAULT '{}', -- ['pdf', 'jpg', 'png', 'doc', 'docx']
    max_file_size_mb INTEGER DEFAULT 10,
    requires_expiry_date BOOLEAN DEFAULT false,
    auto_expire_days INTEGER, -- Auto-expire after X days if no expiry date
    description TEXT,
    example_files TEXT[], -- URLs to example files
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- STEP 3: Update Compliance Records to Link Documents
-- =============================================================================

-- Add document reference to compliance records
ALTER TABLE public.user_compliance_records 
ADD COLUMN IF NOT EXISTS primary_document_id UUID REFERENCES public.compliance_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_document_upload TIMESTAMP WITH TIME ZONE;

-- =============================================================================
-- STEP 4: Create Document Management Functions
-- =============================================================================

-- Function to upload compliance document
CREATE OR REPLACE FUNCTION upload_compliance_document(
    p_user_id UUID,
    p_metric_id UUID,
    p_file_name VARCHAR(255),
    p_file_path VARCHAR(500),
    p_file_type VARCHAR(100),
    p_file_size BIGINT,
    p_expiry_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    document_id UUID;
    requirement_record RECORD;
BEGIN
    -- Get document requirements for this metric
    SELECT * INTO requirement_record
    FROM public.compliance_document_requirements
    WHERE metric_id = p_metric_id;
    
    -- Validate file type if requirements exist
    IF requirement_record.id IS NOT NULL THEN
        IF array_length(requirement_record.required_file_types, 1) > 0 THEN
            IF NOT (p_file_type = ANY(requirement_record.required_file_types)) THEN
                RAISE EXCEPTION 'File type % not allowed. Allowed types: %', 
                    p_file_type, array_to_string(requirement_record.required_file_types, ', ');
            END IF;
        END IF;
        
        -- Validate file size
        IF p_file_size > (requirement_record.max_file_size_mb * 1024 * 1024) THEN
            RAISE EXCEPTION 'File size exceeds maximum allowed size of % MB', 
                requirement_record.max_file_size_mb;
        END IF;
        
        -- Validate expiry date requirement
        IF requirement_record.requires_expiry_date AND p_expiry_date IS NULL THEN
            RAISE EXCEPTION 'Expiry date is required for this document type';
        END IF;
    END IF;
    
    -- Mark previous documents as not current
    UPDATE public.compliance_documents
    SET is_current = false, updated_at = NOW()
    WHERE user_id = p_user_id AND metric_id = p_metric_id AND is_current = true;
    
    -- Insert new document
    INSERT INTO public.compliance_documents (
        user_id, metric_id, file_name, file_path, file_type, file_size, expiry_date
    ) VALUES (
        p_user_id, p_metric_id, p_file_name, p_file_path, p_file_type, p_file_size, p_expiry_date
    ) RETURNING id INTO document_id;
    
    -- Update compliance record
    INSERT INTO public.user_compliance_records (
        user_id, metric_id, current_value, compliance_status, 
        last_checked_at, primary_document_id, document_count, last_document_upload
    ) VALUES (
        p_user_id, p_metric_id, 
        jsonb_build_object('document_uploaded', true, 'file_name', p_file_name),
        'pending', NOW(), document_id, 1, NOW()
    )
    ON CONFLICT (user_id, metric_id) 
    DO UPDATE SET
        current_value = jsonb_build_object('document_uploaded', true, 'file_name', p_file_name),
        compliance_status = 'pending',
        last_checked_at = NOW(),
        primary_document_id = document_id,
        document_count = EXCLUDED.document_count + 1,
        last_document_upload = NOW(),
        updated_at = NOW();
    
    -- Log the upload
    INSERT INTO public.compliance_audit_log (
        user_id, metric_id, audit_type, new_value, performed_by
    ) VALUES (
        p_user_id, p_metric_id, 'document_upload', 
        jsonb_build_object('document_id', document_id, 'file_name', p_file_name),
        p_user_id
    );
    
    RETURN document_id;
END;
$$;

-- Function to verify compliance document
CREATE OR REPLACE FUNCTION verify_compliance_document(
    p_document_id UUID,
    p_verification_status VARCHAR(20),
    p_verification_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    doc_record RECORD;
    new_compliance_status VARCHAR(20);
BEGIN
    -- Get document details
    SELECT cd.*, cm.name as metric_name
    INTO doc_record
    FROM public.compliance_documents cd
    JOIN public.compliance_metrics cm ON cd.metric_id = cm.id
    WHERE cd.id = p_document_id;
    
    IF doc_record.id IS NULL THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    -- Determine compliance status based on verification
    CASE p_verification_status
        WHEN 'approved' THEN
            -- Check if document is expired
            IF doc_record.expiry_date IS NOT NULL AND doc_record.expiry_date < CURRENT_DATE THEN
                new_compliance_status := 'non_compliant';
            ELSE
                new_compliance_status := 'compliant';
            END IF;
        WHEN 'rejected' THEN
            new_compliance_status := 'non_compliant';
        ELSE
            new_compliance_status := 'pending';
    END CASE;
    
    -- Update document verification
    UPDATE public.compliance_documents
    SET 
        verification_status = p_verification_status,
        verified_by = auth.uid(),
        verified_at = NOW(),
        verification_notes = p_verification_notes,
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE id = p_document_id;
    
    -- Update compliance record
    UPDATE public.user_compliance_records
    SET 
        compliance_status = new_compliance_status,
        last_checked_at = NOW(),
        verified_by = auth.uid(),
        verified_at = NOW(),
        updated_at = NOW()
    WHERE user_id = doc_record.user_id AND metric_id = doc_record.metric_id;
    
    -- Log the verification
    INSERT INTO public.compliance_audit_log (
        user_id, metric_id, audit_type, old_value, new_value, performed_by
    ) VALUES (
        doc_record.user_id, doc_record.metric_id, 'document_verification',
        jsonb_build_object('old_status', 'pending'),
        jsonb_build_object(
            'new_status', p_verification_status,
            'compliance_status', new_compliance_status,
            'notes', p_verification_notes
        ),
        auth.uid()
    );
    
    -- Create action if rejected
    IF p_verification_status = 'rejected' THEN
        INSERT INTO public.compliance_actions (
            user_id, metric_id, action_type, title, description, priority, assigned_by
        ) VALUES (
            doc_record.user_id, doc_record.metric_id, 'required',
            'Resubmit ' || doc_record.metric_name || ' Documentation',
            'Previous document was rejected: ' || COALESCE(p_rejection_reason, 'No reason provided'),
            'high', auth.uid()
        );
    END IF;
END;
$$;

-- Function to check for expired documents
CREATE OR REPLACE FUNCTION check_expired_compliance_documents()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    expired_count INTEGER := 0;
    doc_record RECORD;
BEGIN
    -- Find expired documents
    FOR doc_record IN
        SELECT cd.*, cm.name as metric_name
        FROM public.compliance_documents cd
        JOIN public.compliance_metrics cm ON cd.metric_id = cm.id
        WHERE cd.is_current = true 
        AND cd.verification_status = 'approved'
        AND cd.expiry_date IS NOT NULL 
        AND cd.expiry_date < CURRENT_DATE
    LOOP
        -- Mark document as expired
        UPDATE public.compliance_documents
        SET verification_status = 'expired', updated_at = NOW()
        WHERE id = doc_record.id;
        
        -- Update compliance record
        UPDATE public.user_compliance_records
        SET compliance_status = 'non_compliant', updated_at = NOW()
        WHERE user_id = doc_record.user_id AND metric_id = doc_record.metric_id;
        
        -- Create renewal action
        INSERT INTO public.compliance_actions (
            user_id, metric_id, action_type, title, description, priority, due_date
        ) VALUES (
            doc_record.user_id, doc_record.metric_id, 'required',
            'Renew ' || doc_record.metric_name,
            'Document expired on ' || doc_record.expiry_date::text,
            'high', CURRENT_DATE + INTERVAL '30 days'
        );
        
        expired_count := expired_count + 1;
    END LOOP;
    
    RETURN expired_count;
END;
$$;

-- =============================================================================
-- STEP 5: Create RLS Policies
-- =============================================================================

ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_document_requirements ENABLE ROW LEVEL SECURITY;

-- Documents - Users can view their own, SA/AD can view all
DROP POLICY IF EXISTS "admin_full_documents_access" ON public.compliance_documents;
CREATE POLICY "admin_full_documents_access" ON public.compliance_documents
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "users_own_documents_access" ON public.compliance_documents;
CREATE POLICY "users_own_documents_access" ON public.compliance_documents
FOR ALL USING (user_id = auth.uid());

-- Document Requirements - All authenticated users can view
DROP POLICY IF EXISTS "authenticated_view_requirements" ON public.compliance_document_requirements;
CREATE POLICY "authenticated_view_requirements" ON public.compliance_document_requirements
FOR SELECT USING (true);

DROP POLICY IF EXISTS "admin_manage_requirements" ON public.compliance_document_requirements;
CREATE POLICY "admin_manage_requirements" ON public.compliance_document_requirements
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- =============================================================================
-- STEP 6: Create Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_compliance_documents_user_metric ON public.compliance_documents(user_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_verification_status ON public.compliance_documents(verification_status);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_expiry_date ON public.compliance_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_is_current ON public.compliance_documents(is_current);
CREATE INDEX IF NOT EXISTS idx_document_requirements_metric_id ON public.compliance_document_requirements(metric_id);

-- =============================================================================
-- STEP 7: Insert Default Document Requirements
-- =============================================================================

INSERT INTO public.compliance_document_requirements (metric_id, document_type, required_file_types, max_file_size_mb, requires_expiry_date, description) 
SELECT 
    cm.id,
    CASE 
        WHEN cm.name ILIKE '%certification%' OR cm.name ILIKE '%cpr%' OR cm.name ILIKE '%first aid%' THEN 'certificate'
        WHEN cm.name ILIKE '%insurance%' THEN 'insurance_policy'
        WHEN cm.name ILIKE '%training%' THEN 'training_record'
        WHEN cm.name ILIKE '%background%' THEN 'background_check'
        ELSE 'document'
    END,
    ARRAY['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    10,
    CASE 
        WHEN cm.name ILIKE '%certification%' OR cm.name ILIKE '%cpr%' OR cm.name ILIKE '%first aid%' OR cm.name ILIKE '%insurance%' THEN true
        ELSE false
    END,
    'Upload supporting documentation for ' || cm.name
FROM public.compliance_metrics cm
WHERE NOT EXISTS (
    SELECT 1 FROM public.compliance_document_requirements cdr 
    WHERE cdr.metric_id = cm.id
)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- STEP 8: Grant Permissions
-- =============================================================================

GRANT SELECT, INSERT, UPDATE ON public.compliance_documents TO authenticated;
GRANT SELECT ON public.compliance_document_requirements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.compliance_document_requirements TO authenticated;

RAISE NOTICE 'Compliance Document Management System created successfully!';
RAISE NOTICE 'Added tables: compliance_documents, compliance_document_requirements';
RAISE NOTICE 'Added functions: upload_compliance_document, verify_compliance_document, check_expired_compliance_documents';
RAISE NOTICE 'Document upload and verification workflow is now functional';