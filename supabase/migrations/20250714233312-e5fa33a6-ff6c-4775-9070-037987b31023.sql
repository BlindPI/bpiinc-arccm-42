-- Add DELETE RLS policy for student_rosters table
CREATE POLICY "Allow authorized users to delete rosters" 
ON public.student_rosters 
FOR DELETE 
USING (
  -- Allow SA, AD, AP users to delete any roster
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('SA', 'AD', 'AP')
  )
  OR
  -- Allow roster creators to delete their own rosters
  created_by = auth.uid()
);