-- Add booking_id field to student_rosters table to link rosters to availability_bookings
-- Migration: 20250719_add_booking_id_to_student_rosters

-- Add booking_id column to student_rosters to link with availability_bookings
ALTER TABLE public.student_rosters 
ADD COLUMN booking_id uuid NULL;

-- Add foreign key constraint to availability_bookings
ALTER TABLE public.student_rosters 
ADD CONSTRAINT student_rosters_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.availability_bookings(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON COLUMN public.student_rosters.booking_id IS 'Links this roster to a specific availability booking (training session or course instruction). Used for session-based roster management.';

-- Add index for performance on booking_id lookups
CREATE INDEX IF NOT EXISTS idx_student_rosters_booking_id 
ON public.student_rosters (booking_id) 
WHERE booking_id IS NOT NULL;

-- Add index for combined queries on booking_id and roster_status
CREATE INDEX IF NOT EXISTS idx_student_rosters_booking_status 
ON public.student_rosters (booking_id, roster_status) 
WHERE booking_id IS NOT NULL;