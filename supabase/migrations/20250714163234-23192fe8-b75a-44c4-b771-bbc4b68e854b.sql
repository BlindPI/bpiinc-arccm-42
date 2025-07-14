-- Phase 1: Update availability_bookings table for multi-course support

-- Add course_sequence JSONB field to store multi-course training data
ALTER TABLE public.availability_bookings 
ADD COLUMN course_sequence JSONB DEFAULT NULL;

-- Make course_id nullable since we'll use course_sequence for multi-course bookings
ALTER TABLE public.availability_bookings 
ALTER COLUMN course_id DROP NOT NULL;

-- Add index for efficient querying of course sequence data
CREATE INDEX idx_availability_bookings_course_sequence 
ON public.availability_bookings USING GIN (course_sequence);

-- Add comment for documentation
COMMENT ON COLUMN public.availability_bookings.course_sequence IS 'JSONB array containing course sequence data for multi-course training sessions. Each item contains course_id, duration_minutes, break_after_minutes, and course details.';

-- Add index for filtering bookings with course sequences
CREATE INDEX idx_availability_bookings_has_sequence 
ON public.availability_bookings ((course_sequence IS NOT NULL));

-- Create partial index for single-course bookings (backward compatibility)
CREATE INDEX idx_availability_bookings_single_course 
ON public.availability_bookings (course_id) 
WHERE course_id IS NOT NULL AND course_sequence IS NULL;