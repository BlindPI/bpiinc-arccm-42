-- Phase 1: Database Integrity Fix
-- Clean up duplicate roster assignments first
UPDATE availability_bookings SET roster_id = NULL 
WHERE id IN (
  SELECT ab.id 
  FROM availability_bookings ab
  JOIN student_rosters sr ON sr.availability_booking_id = ab.id
  WHERE ab.roster_id != sr.id
);

-- Fix inconsistent assignments where student_rosters.availability_booking_id doesn't match availability_bookings.roster_id
UPDATE availability_bookings 
SET roster_id = (
  SELECT sr.id 
  FROM student_rosters sr 
  WHERE sr.availability_booking_id = availability_bookings.id
)
WHERE EXISTS (
  SELECT 1 FROM student_rosters sr 
  WHERE sr.availability_booking_id = availability_bookings.id 
  AND (availability_bookings.roster_id IS NULL OR availability_bookings.roster_id != sr.id)
);

-- Add unique constraint to prevent multiple rosters per booking
ALTER TABLE availability_bookings 
ADD CONSTRAINT unique_roster_per_booking 
UNIQUE (roster_id) DEFERRABLE INITIALLY DEFERRED;

-- Create trigger to maintain referential integrity between student_rosters and availability_bookings
CREATE OR REPLACE FUNCTION sync_roster_booking_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When student_rosters.availability_booking_id is updated
  IF TG_TABLE_NAME = 'student_rosters' THEN
    -- Clear old booking assignment
    IF OLD.availability_booking_id IS NOT NULL AND OLD.availability_booking_id != NEW.availability_booking_id THEN
      UPDATE availability_bookings 
      SET roster_id = NULL 
      WHERE id = OLD.availability_booking_id AND roster_id = OLD.id;
    END IF;
    
    -- Set new booking assignment
    IF NEW.availability_booking_id IS NOT NULL THEN
      UPDATE availability_bookings 
      SET roster_id = NEW.id 
      WHERE id = NEW.availability_booking_id;
    END IF;
  END IF;
  
  -- When availability_bookings.roster_id is updated
  IF TG_TABLE_NAME = 'availability_bookings' THEN
    -- Clear old roster assignment
    IF OLD.roster_id IS NOT NULL AND OLD.roster_id != NEW.roster_id THEN
      UPDATE student_rosters 
      SET availability_booking_id = NULL 
      WHERE id = OLD.roster_id AND availability_booking_id = OLD.id;
    END IF;
    
    -- Set new roster assignment
    IF NEW.roster_id IS NOT NULL THEN
      UPDATE student_rosters 
      SET availability_booking_id = NEW.id 
      WHERE id = NEW.roster_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for both tables
CREATE TRIGGER roster_booking_sync_from_rosters
  AFTER UPDATE OF availability_booking_id ON student_rosters
  FOR EACH ROW EXECUTE FUNCTION sync_roster_booking_assignment();

CREATE TRIGGER roster_booking_sync_from_bookings
  AFTER UPDATE OF roster_id ON availability_bookings
  FOR EACH ROW EXECUTE FUNCTION sync_roster_booking_assignment();