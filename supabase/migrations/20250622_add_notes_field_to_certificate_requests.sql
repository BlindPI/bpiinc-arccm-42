-- Add notes field to certificate_requests table to capture additional student information
-- This field will store any notes/comments from batch uploads that may contain
-- special requirements, conditions, or other important student-specific information

ALTER TABLE public.certificate_requests 
ADD COLUMN IF NOT EXISTS notes TEXT NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN public.certificate_requests.notes IS 
'Additional notes or comments about the certificate request, typically captured from batch upload files';

-- Create index for searching notes if needed
CREATE INDEX IF NOT EXISTS idx_certificate_requests_notes_search 
ON public.certificate_requests USING gin(to_tsvector('english', notes))
WHERE notes IS NOT NULL;

DO $$
BEGIN
  RAISE NOTICE 'Certificate Requests Notes Field Added:';
  RAISE NOTICE '✅ Added notes column to certificate_requests table';
  RAISE NOTICE '✅ Added full-text search index for notes field';
  RAISE NOTICE '✅ Ready to capture NOTES data from batch uploads';
END $$;