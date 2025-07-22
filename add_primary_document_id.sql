-- Add missing primary_document_id column to user_compliance_records table
ALTER TABLE user_compliance_records 
ADD COLUMN primary_document_id uuid REFERENCES compliance_documents(id);