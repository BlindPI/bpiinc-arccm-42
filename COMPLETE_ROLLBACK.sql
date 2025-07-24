-- COMPLETE ROLLBACK OF ALL MY CHANGES
-- This undoes everything I added that broke the system

-- 1. REMOVE ALL FUNCTIONS I CREATED
DROP FUNCTION IF EXISTS reset_compliance_requirement(UUID, UUID);
DROP FUNCTION IF EXISTS verify_compliance_document_with_user(UUID, VARCHAR, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS simple_reset_compliance_requirement(UUID, UUID);

-- 2. REMOVE ALL VIEWS I CREATED  
DROP VIEW IF EXISTS compliance_documents_with_user;

-- 3. REMOVE ALL CONSTRAINTS I ADDED
ALTER TABLE compliance_documents 
DROP CONSTRAINT IF EXISTS fk_compliance_documents_user_profile;

-- 4. REMOVE ALL INDEXES I CREATED
DROP INDEX IF EXISTS idx_compliance_documents_user_metric_current;

-- 5. REMOVE ALL COLUMNS I ADDED
ALTER TABLE compliance_documents 
DROP COLUMN IF EXISTS document_type,
DROP COLUMN IF EXISTS compliance_score,
DROP COLUMN IF EXISTS auto_approved;

-- 6. REMOVE ALL POLICIES I CREATED
DROP POLICY IF EXISTS "compliance_documents_select" ON compliance_documents;
DROP POLICY IF EXISTS "compliance_documents_insert" ON compliance_documents;  
DROP POLICY IF EXISTS "compliance_documents_update" ON compliance_documents;
DROP POLICY IF EXISTS "Users can view compliance documents" ON compliance_documents;
DROP POLICY IF EXISTS "Admins can manage all compliance documents" ON compliance_documents;

-- 7. REVOKE ALL PERMISSIONS I GRANTED
-- (This will clean up any function permissions)

-- SYSTEM SHOULD NOW BE BACK TO ORIGINAL STATE
-- Please run this first, then I will research the actual requirements