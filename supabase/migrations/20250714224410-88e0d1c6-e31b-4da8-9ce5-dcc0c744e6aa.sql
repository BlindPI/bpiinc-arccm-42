-- Add roster_type field to both roster tables to distinguish between types
ALTER TABLE public.rosters ADD COLUMN IF NOT EXISTS roster_type VARCHAR(20) DEFAULT 'CERTIFICATE';
ALTER TABLE public.student_rosters ADD COLUMN IF NOT EXISTS roster_type VARCHAR(20) DEFAULT 'TRAINING';

-- Add course_sequence column to student_rosters if it doesn't exist (for backwards compatibility)
ALTER TABLE public.student_rosters ADD COLUMN IF NOT EXISTS course_sequence JSONB DEFAULT '{"items": [], "totalDuration": 0}'::jsonb;

-- Update existing rosters to have proper types
UPDATE public.rosters SET roster_type = 'CERTIFICATE' WHERE roster_type IS NULL;
UPDATE public.student_rosters SET roster_type = 'TRAINING' WHERE roster_type IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_rosters_type ON public.rosters(roster_type);
CREATE INDEX IF NOT EXISTS idx_student_rosters_type ON public.student_rosters(roster_type);