-- Create compliance_documents table to track uploads
CREATE TABLE IF NOT EXISTS public.compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL,
  document_name TEXT NOT NULL,
  document_path TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  upload_notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on compliance_documents
ALTER TABLE public.compliance_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for compliance_documents
CREATE POLICY "Users can view their own compliance documents" 
ON public.compliance_documents 
FOR SELECT 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('SA', 'AD', 'AP')
));

CREATE POLICY "Users can insert their own compliance documents" 
ON public.compliance_documents 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own compliance documents" 
ON public.compliance_documents 
FOR UPDATE 
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('SA', 'AD', 'AP')
));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_compliance_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compliance_documents_updated_at
    BEFORE UPDATE ON public.compliance_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_compliance_documents_updated_at();