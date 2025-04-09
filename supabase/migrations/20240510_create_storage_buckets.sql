
-- Create the fonts storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('fonts', 'fonts', true, 5242880, ARRAY['font/ttf', 'font/otf', 'application/x-font-ttf', 'application/x-font-otf'])
ON CONFLICT (id) DO NOTHING;

-- Set RLS policies for the fonts bucket
CREATE POLICY "Anyone can read fonts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'fonts');

CREATE POLICY "Authenticated users can upload fonts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'fonts' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update fonts" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'fonts' AND auth.role() = 'authenticated')
WITH CHECK (bucket_id = 'fonts' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete fonts" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'fonts' AND auth.role() = 'authenticated');
