-- Add DELETE policy for availability_bookings table
CREATE POLICY "Users can delete their own bookings and admins can delete all" 
ON public.availability_bookings 
FOR DELETE 
USING (
  (user_id = auth.uid()) OR 
  (created_by = auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = ANY (ARRAY['SA'::text, 'AD'::text, 'AP'::text])
  ))
);