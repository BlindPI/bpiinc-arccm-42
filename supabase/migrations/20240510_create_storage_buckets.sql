
-- Create the fonts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('fonts', 'fonts', true, 5242880, ARRAY['font/ttf', 'font/otf', 'application/octet-stream', 'application/x-font-ttf', 'application/x-font-otf'])
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies for fonts bucket if they exist
DROP POLICY IF EXISTS "Public can read fonts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload fonts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update fonts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete fonts" ON storage.objects;

-- Set RLS policies for the fonts bucket
CREATE POLICY "Public can read fonts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fonts');

-- Only admins can upload fonts
CREATE POLICY "Admins can upload fonts" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'fonts' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SA', 'AD')
);

-- Only admins can update fonts
CREATE POLICY "Admins can update fonts" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'fonts' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SA', 'AD')
)
WITH CHECK (
  bucket_id = 'fonts' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SA', 'AD')
);

-- Only admins can delete fonts
CREATE POLICY "Admins can delete fonts" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'fonts' AND 
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SA', 'AD')
);
