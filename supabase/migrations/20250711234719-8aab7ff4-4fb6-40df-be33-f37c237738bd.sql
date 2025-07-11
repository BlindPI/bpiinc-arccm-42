-- Create storage bucket for student CSV imports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-imports', 'student-imports', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for student imports bucket
CREATE POLICY "Authenticated users can upload student files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'student-imports' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can read student files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'student-imports' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete student files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'student-imports' AND 
  auth.role() = 'authenticated'
);

-- Create RLS policies for student_enrollment_profiles table
CREATE POLICY "SA and AD can manage all student profiles" 
ON student_enrollment_profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "Users can view student profiles" 
ON student_enrollment_profiles 
FOR SELECT 
USING (true);