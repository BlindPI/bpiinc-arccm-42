-- Clean up locations table policies
DROP POLICY IF EXISTS "Locations admin access" ON locations;
DROP POLICY IF EXISTS "Locations read access" ON locations;
DROP POLICY IF EXISTS "Allow all users to view locations" ON locations;
DROP POLICY IF EXISTS "Only admins can modify locations" ON locations;

-- Create clear RLS policies for locations
CREATE POLICY "locations_select_policy" ON locations
FOR SELECT 
USING (
  status = 'ACTIVE' OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "locations_insert_policy" ON locations
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);

CREATE POLICY "locations_update_policy" ON locations
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

CREATE POLICY "locations_delete_policy" ON locations
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('SA', 'AD')
  )
);