-- Add course_id to student_roster_members for individual course assignments
ALTER TABLE student_roster_members 
ADD COLUMN course_id uuid REFERENCES courses(id);

-- Add availability_booking_id to student_rosters for booking assignment
ALTER TABLE student_rosters 
ADD COLUMN availability_booking_id uuid REFERENCES availability_bookings(id);

-- Create index for better performance
CREATE INDEX idx_student_roster_members_course_id ON student_roster_members(course_id);
CREATE INDEX idx_student_rosters_availability_booking_id ON student_rosters(availability_booking_id);