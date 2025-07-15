-- Fix the trigger function that's causing "record has no field status" error
-- The issue is the trigger is trying to access a field that doesn't exist

-- Drop existing triggers first
DROP TRIGGER IF EXISTS roster_booking_sync_from_rosters ON student_rosters;
DROP TRIGGER IF EXISTS roster_booking_sync_from_bookings ON availability_bookings;

-- Update the function to remove any problematic field references
CREATE OR REPLACE FUNCTION sync_roster_booking_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- When student_rosters.availability_booking_id is updated
  IF TG_TABLE_NAME = 'student_rosters' THEN
    -- Clear old booking assignment if it changed
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
    -- Clear old roster assignment if it changed
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

-- Recreate triggers
CREATE TRIGGER roster_booking_sync_from_rosters
  AFTER UPDATE OF availability_booking_id ON student_rosters
  FOR EACH ROW EXECUTE FUNCTION sync_roster_booking_assignment();

CREATE TRIGGER roster_booking_sync_from_bookings
  AFTER UPDATE OF roster_id ON availability_bookings
  FOR EACH ROW EXECUTE FUNCTION sync_roster_booking_assignment();

-- Fix data synchronization issues
-- First, clear any inconsistent roster_id assignments in availability_bookings
UPDATE availability_bookings 
SET roster_id = NULL 
WHERE roster_id IS NOT NULL 
AND NOT EXISTS (
  SELECT 1 FROM student_rosters sr 
  WHERE sr.id = availability_bookings.roster_id 
  AND sr.availability_booking_id = availability_bookings.id
);

-- Then sync proper assignments from student_rosters
UPDATE availability_bookings 
SET roster_id = sr.id
FROM student_rosters sr 
WHERE sr.availability_booking_id = availability_bookings.id
AND availability_bookings.roster_id IS NULL;