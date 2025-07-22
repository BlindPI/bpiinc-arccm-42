-- Add missing document_count column to user_compliance_records table
ALTER TABLE user_compliance_records 
ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;

-- Update existing records to set proper document count
UPDATE user_compliance_records 
SET document_count = (
    SELECT COUNT(*) 
    FROM compliance_documents cd 
    WHERE cd.user_id = user_compliance_records.user_id 
    AND cd.metric_id = user_compliance_records.metric_id
    AND cd.verification_status = 'approved'
);

-- Add comment explaining the column
COMMENT ON COLUMN user_compliance_records.document_count IS 'Count of approved compliance documents for this metric';