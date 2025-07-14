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

-- Create clear RLS policies for courses
CREATE POLICY "courses_select_policy" ON courses
FOR SELECT 
USING (
  status = 'ACTIVE' OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "courses_insert_policy" ON courses
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "courses_update_policy" ON courses
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "courses_delete_policy" ON courses
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);