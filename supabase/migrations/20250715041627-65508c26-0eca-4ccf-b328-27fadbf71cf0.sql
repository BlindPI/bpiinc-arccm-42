-- Add missing course_id column to student_rosters table
ALTER TABLE public.student_rosters ADD COLUMN IF NOT EXISTS course_id UUID;

-- Add foreign key constraint to courses table
ALTER TABLE public.student_rosters 
ADD CONSTRAINT fk_student_rosters_course_id 
FOREIGN KEY (course_id) REFERENCES public.courses(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_student_rosters_course_id ON public.student_rosters(course_id);