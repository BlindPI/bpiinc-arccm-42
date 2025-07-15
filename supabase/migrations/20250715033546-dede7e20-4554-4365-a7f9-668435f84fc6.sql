-- Create storage bucket for compliance documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('compliance-documents', 'compliance-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Create RLS policies for compliance documents storage
CREATE POLICY "Users can view their own compliance documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'compliance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own compliance documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'compliance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own compliance documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'compliance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own compliance documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'compliance-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- SA and AD can access all compliance documents
CREATE POLICY "Admins can access all compliance documents" 
ON storage.objects 
FOR ALL 
USING (
  bucket_id = 'compliance-documents' 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('SA', 'AD')
  )
);

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