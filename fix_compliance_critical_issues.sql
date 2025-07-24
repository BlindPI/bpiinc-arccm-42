-- CRITICAL FIX 1: Fix missing user profile data in document verification
-- The verification queue shows "Unknown User" because foreign key relationships are broken

-- Add missing foreign key constraint for user profiles
ALTER TABLE compliance_documents 
ADD CONSTRAINT fk_compliance_documents_user_profile 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- CRITICAL FIX 2: Remove the invalid unique constraint causing upload failures
-- The current constraint prevents multiple documents per user+metric
ALTER TABLE compliance_documents 
DROP CONSTRAINT IF EXISTS compliance_documents_user_metric_unique;

-- CRITICAL FIX 3: Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_documents_user_metric_current 
ON compliance_documents(user_id, metric_id, is_current) 
WHERE is_current = true;

-- CRITICAL FIX 4: Add missing columns for proper document verification
ALTER TABLE compliance_documents 
ADD COLUMN IF NOT EXISTS document_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS compliance_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT false;

-- CRITICAL FIX 5: Create view for proper user data in verification queue
CREATE OR REPLACE VIEW compliance_documents_with_user AS
SELECT 
    cd.*,
    p.display_name,
    p.email,
    p.role,
    p.compliance_tier,
    cm.name as metric_name,
    cm.description as metric_description,
    cm.category
FROM compliance_documents cd
LEFT JOIN profiles p ON cd.user_id = p.id
LEFT JOIN compliance_metrics cm ON cd.metric_id = cm.id;

-- CRITICAL FIX 6: Add function to reset individual compliance requirements
CREATE OR REPLACE FUNCTION reset_compliance_requirement(
    p_user_id UUID,
    p_metric_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Mark all documents as not current
    UPDATE compliance_documents 
    SET is_current = false, 
        verification_status = 'archived',
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND metric_id = p_metric_id;
    
    -- Reset compliance record status
    UPDATE user_compliance_records 
    SET compliance_status = 'pending',
        current_value = NULL,
        evidence_files = NULL,
        submission_data = NULL,
        reviewer_id = NULL,
        reviewed_at = NULL,
        review_notes = NULL,
        approved_by = NULL,
        approved_at = NULL,
        rejection_reason = NULL,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND metric_id = p_metric_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL FIX 7: Add function to properly verify documents with user data
CREATE OR REPLACE FUNCTION verify_compliance_document_with_user(
    p_document_id UUID,
    p_verification_status VARCHAR(20),
    p_verification_notes TEXT DEFAULT NULL,
    p_rejection_reason TEXT DEFAULT NULL,
    p_verified_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    doc_record RECORD;
BEGIN
    -- Get document with user info
    SELECT cd.*, p.display_name, p.email 
    INTO doc_record
    FROM compliance_documents cd
    LEFT JOIN profiles p ON cd.user_id = p.id
    WHERE cd.id = p_document_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Document not found';
    END IF;
    
    -- Update document
    UPDATE compliance_documents 
    SET verification_status = p_verification_status,
        verification_notes = p_verification_notes,
        rejection_reason = p_rejection_reason,
        verified_by = COALESCE(p_verified_by, auth.uid()),
        verified_at = NOW(),
        updated_at = NOW()
    WHERE id = p_document_id;
    
    -- Update corresponding compliance record
    UPDATE user_compliance_records 
    SET compliance_status = CASE 
            WHEN p_verification_status = 'approved' THEN 'compliant'::compliance_status_enum
            WHEN p_verification_status = 'rejected' THEN 'non_compliant'::compliance_status_enum
            ELSE 'pending'::compliance_status_enum
        END,
        reviewer_id = COALESCE(p_verified_by, auth.uid()),
        reviewed_at = NOW(),
        review_notes = p_verification_notes,
        approved_by = CASE WHEN p_verification_status = 'approved' THEN COALESCE(p_verified_by, auth.uid()) ELSE NULL END,
        approved_at = CASE WHEN p_verification_status = 'approved' THEN NOW() ELSE NULL END,
        rejection_reason = p_rejection_reason,
        updated_at = NOW()
    WHERE user_id = doc_record.user_id 
    AND metric_id = doc_record.metric_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL FIX 8: Grant proper permissions
GRANT SELECT ON compliance_documents_with_user TO authenticated;
GRANT EXECUTE ON FUNCTION reset_compliance_requirement TO authenticated;
GRANT EXECUTE ON FUNCTION verify_compliance_document_with_user TO authenticated;

-- CRITICAL FIX 9: Update RLS policies for proper access
DROP POLICY IF EXISTS "Users can view compliance documents" ON compliance_documents;
CREATE POLICY "Users can view compliance documents" ON compliance_documents
FOR SELECT USING (
    auth.uid() = user_id OR 
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
    )
);

DROP POLICY IF EXISTS "Admins can manage all compliance documents" ON compliance_documents;
CREATE POLICY "Admins can manage all compliance documents" ON compliance_documents
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
    )
);