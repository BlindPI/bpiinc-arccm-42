-- Add assessment fields to student_roster_members for instructor use
ALTER TABLE public.student_roster_members 
ADD COLUMN IF NOT EXISTS attendance_status VARCHAR(20) DEFAULT 'pending' CHECK (attendance_status IN ('pending', 'present', 'absent', 'partial')),
ADD COLUMN IF NOT EXISTS practical_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS written_score DECIMAL(5,2), 
ADD COLUMN IF NOT EXISTS completion_status VARCHAR(20) DEFAULT 'not_started' CHECK (completion_status IN ('not_started', 'in_progress', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS assessed_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for instructor queries
CREATE INDEX IF NOT EXISTS idx_student_roster_members_assessed_by ON public.student_roster_members(assessed_by);
CREATE INDEX IF NOT EXISTS idx_student_roster_members_completion_status ON public.student_roster_members(completion_status);

-- Update availability_bookings to ensure instructor assignments are clear
CREATE INDEX IF NOT EXISTS idx_availability_bookings_user_instructor ON public.availability_bookings(user_id, booking_type) WHERE booking_type IN ('course_instruction', 'training_session');

-- Function to get instructor assigned courses
CREATE OR REPLACE FUNCTION public.get_instructor_assigned_courses(p_instructor_id UUID)
RETURNS TABLE(
  booking_id UUID,
  title VARCHAR,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  roster_id UUID,
  roster_name VARCHAR,
  student_count BIGINT,
  completion_status VARCHAR
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ab.id as booking_id,
    ab.title,
    ab.booking_date,
    ab.start_time,
    ab.end_time,
    ab.roster_id,
    sr.name as roster_name,
    COUNT(srm.id) as student_count,
    CASE 
      WHEN COUNT(srm.id) = 0 THEN 'no_students'
      WHEN COUNT(CASE WHEN srm.completion_status = 'completed' THEN 1 END) = COUNT(srm.id) THEN 'completed'
      WHEN COUNT(CASE WHEN srm.completion_status != 'not_started' THEN 1 END) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END as completion_status
  FROM public.availability_bookings ab
  LEFT JOIN public.student_rosters sr ON sr.id = ab.roster_id
  LEFT JOIN public.student_roster_members srm ON srm.roster_id = ab.roster_id
  WHERE ab.user_id = p_instructor_id
    AND ab.booking_type IN ('course_instruction', 'training_session')
  GROUP BY ab.id, ab.title, ab.booking_date, ab.start_time, ab.end_time, ab.roster_id, sr.name
  ORDER BY ab.booking_date DESC, ab.start_time;
END;
$$;