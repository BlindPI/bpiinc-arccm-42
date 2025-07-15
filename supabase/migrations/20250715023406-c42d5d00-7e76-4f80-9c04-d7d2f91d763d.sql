-- COMPLETE ROSTER-BOOKING ASSIGNMENT SYSTEM REDESIGN
-- Phase 1: Remove all problematic triggers and functions

-- Drop existing triggers completely
DROP TRIGGER IF EXISTS roster_booking_sync_from_rosters ON student_rosters;
DROP TRIGGER IF EXISTS roster_booking_sync_from_bookings ON availability_bookings;
DROP TRIGGER IF EXISTS update_roster_enrollment_count ON student_roster_members;

-- Drop the problematic sync function
DROP FUNCTION IF EXISTS sync_roster_booking_assignment();

-- Phase 2: Remove roster_id column from availability_bookings to eliminate bi-directional relationship
-- This makes student_rosters.availability_booking_id the single source of truth
ALTER TABLE availability_bookings DROP COLUMN IF EXISTS roster_id;

-- Phase 3: Add proper constraints for data integrity
-- Ensure only one roster can be assigned to each booking
ALTER TABLE student_rosters 
ADD CONSTRAINT unique_availability_booking_assignment 
UNIQUE (availability_booking_id) DEFERRABLE INITIALLY DEFERRED;

-- Add foreign key constraint for referential integrity
ALTER TABLE student_rosters 
ADD CONSTRAINT fk_student_rosters_availability_booking 
FOREIGN KEY (availability_booking_id) REFERENCES availability_bookings(id) 
ON DELETE SET NULL;

-- Phase 4: Create a simple trigger for enrollment count (uni-directional only)
CREATE OR REPLACE FUNCTION update_roster_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment + 1 
        WHERE id = NEW.roster_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment - 1 
        WHERE id = OLD.roster_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate enrollment count trigger (this is safe as it's uni-directional)
CREATE TRIGGER update_roster_enrollment_count
    AFTER INSERT OR DELETE ON student_roster_members
    FOR EACH ROW EXECUTE FUNCTION update_roster_enrollment_count();

-- Phase 5: Create a view to easily query roster assignments
CREATE OR REPLACE VIEW roster_booking_assignments AS
SELECT 
    sr.id as roster_id,
    sr.name as roster_name,
    sr.availability_booking_id,
    ab.title as booking_title,
    ab.booking_date,
    ab.start_time,
    ab.end_time,
    ab.user_id as instructor_id,
    sr.current_enrollment,
    sr.max_capacity
FROM student_rosters sr
LEFT JOIN availability_bookings ab ON ab.id = sr.availability_booking_id
WHERE sr.availability_booking_id IS NOT NULL;