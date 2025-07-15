-- Update existing student_rosters to have proper location_id from instructor's team location
UPDATE student_rosters 
SET location_id = '06752dc0-3e19-4ece-98f8-c0b94c2eb818'
WHERE location_id IS NULL 
  AND availability_booking_id IN (
    SELECT id FROM availability_bookings WHERE user_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
  );

-- Find and assign course_id based on booking title containing "First Aid & CPR"
UPDATE student_rosters 
SET course_id = (
  SELECT id FROM courses 
  WHERE name ILIKE '%first aid%' OR name ILIKE '%cpr%' 
  LIMIT 1
)
WHERE course_id IS NULL 
  AND availability_booking_id IN (
    SELECT ab.id FROM availability_bookings ab 
    WHERE ab.user_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
      AND ab.title ILIKE '%first aid%'
  );