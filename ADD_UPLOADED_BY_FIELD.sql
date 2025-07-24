-- Add uploaded_by field to track who actually uploaded documents
-- This is needed because SA/AD/AP users can upload documents FOR other users

ALTER TABLE public.compliance_documents 
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id);

-- Update existing records to set uploaded_by = user_id as default
UPDATE public.compliance_documents 
SET uploaded_by = user_id 
WHERE uploaded_by IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_compliance_documents_uploaded_by ON public.compliance_documents(uploaded_by);

-- Update the service query to include both user profiles
-- The user_id shows WHO the document is FOR
-- The uploaded_by shows WHO actually uploaded it