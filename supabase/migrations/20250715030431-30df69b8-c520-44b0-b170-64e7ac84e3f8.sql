-- Fix the get_instructor_assigned_courses function to use correct table relationships
CREATE OR REPLACE FUNCTION public.get_instructor_assigned_courses(p_instructor_id UUID)
RETURNS TABLE (
  booking_id UUID,
  title TEXT,
  booking_date DATE,
  start_time TIME,
  end_time TIME,
  roster_id UUID,
  roster_name TEXT,
  student_count BIGINT,
  completion_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ab.id as booking_id,
    ab.title,
    ab.booking_date,
    ab.start_time,
    ab.end_time,
    sr.id as roster_id,
    sr.roster_name,
    COUNT(srm.id) as student_count,
    CASE 
      WHEN COUNT(srm.id) = 0 THEN 'no_students'
      WHEN COUNT(CASE WHEN srm.completion_status = 'completed' THEN 1 END) = COUNT(srm.id) THEN 'completed'
      WHEN COUNT(CASE WHEN srm.completion_status != 'not_started' THEN 1 END) > 0 THEN 'in_progress'
      ELSE 'not_started'
    END as completion_status
  FROM public.availability_bookings ab
  LEFT JOIN public.student_rosters sr ON sr.availability_booking_id = ab.id
  LEFT JOIN public.student_roster_members srm ON srm.roster_id = sr.id
  WHERE ab.user_id = p_instructor_id
    AND ab.booking_type IN ('course_instruction', 'training_session')
  GROUP BY ab.id, ab.title, ab.booking_date, ab.start_time, ab.end_time, sr.id, sr.roster_name
  ORDER BY ab.booking_date DESC, ab.start_time;
END;
$function$;