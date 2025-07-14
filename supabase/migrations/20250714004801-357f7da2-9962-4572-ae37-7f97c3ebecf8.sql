-- Clean up conflicting RLS policies on courses table
DROP POLICY IF EXISTS "Admin users can manage courses" ON courses;
DROP POLICY IF EXISTS "Admins can create courses" ON courses;
DROP POLICY IF EXISTS "Admins can update courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to insert courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to update courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view active courses" ON courses;
DROP POLICY IF EXISTS "Anyone can view courses" ON courses;
DROP POLICY IF EXISTS "Users can view courses" ON courses;

-- Create single, clear RLS policy for courses
CREATE POLICY "courses_access_policy" ON courses
FOR ALL 
USING (
  -- Everyone can read active courses, admins can read all
  CASE 
    WHEN TG_OP = 'SELECT' THEN 
      (status = 'ACTIVE' OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
      ))
    ELSE 
      -- Only admins can insert/update/delete
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
      )
  END
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

-- Clean up locations table policies
DROP POLICY IF EXISTS "Locations admin access" ON locations;
DROP POLICY IF EXISTS "Locations read access" ON locations;
DROP POLICY IF EXISTS "Allow all users to view locations" ON locations;
DROP POLICY IF EXISTS "Only admins can modify locations" ON locations;

-- Create single, clear RLS policy for locations
CREATE POLICY "locations_access_policy" ON locations
FOR ALL 
USING (
  -- Everyone can read active locations, admins can read all
  CASE 
    WHEN TG_OP = 'SELECT' THEN 
      (status = 'ACTIVE' OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
      ))
    ELSE 
      -- Only admins can insert/update/delete
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('SA', 'AD')
      )
  END
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);