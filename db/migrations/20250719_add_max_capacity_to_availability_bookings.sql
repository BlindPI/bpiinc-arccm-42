-- Add max_capacity field to availability_bookings table for roster capacity management
-- Migration: 20250719_add_max_capacity_to_availability_bookings

-- Add max_capacity column to availability_bookings
ALTER TABLE public.availability_bookings 
ADD COLUMN max_capacity integer NULL DEFAULT 18;

-- Add comment for documentation
COMMENT ON COLUMN public.availability_bookings.max_capacity IS 'Maximum number of students that can be enrolled in this training session or course instruction. Used for capacity management and enrollment limits.';

-- Add index for capacity-based queries
CREATE INDEX IF NOT EXISTS idx_availability_bookings_capacity 
ON public.availability_bookings (max_capacity, booking_type) 
WHERE max_capacity IS NOT NULL;

-- Add constraint to ensure reasonable capacity limits
ALTER TABLE public.availability_bookings 
ADD CONSTRAINT check_reasonable_capacity 
CHECK (max_capacity IS NULL OR (max_capacity > 0 AND max_capacity <= 500));

-- Update existing training_session and course_instruction bookings to have default capacity
UPDATE public.availability_bookings 
SET max_capacity = 18 
WHERE booking_type IN ('training_session', 'course_instruction') 
AND max_capacity IS NULL;