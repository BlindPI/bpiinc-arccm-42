-- Fix RLS policies for availability_bookings to allow proper access
DROP POLICY IF EXISTS "Users can view own bookings" ON availability_bookings;
DROP POLICY IF EXISTS "Users can create own availability bookings" ON availability_bookings;
DROP POLICY IF EXISTS "Users can update own availability bookings" ON availability_bookings;

-- Create updated RLS policies for availability_bookings
CREATE POLICY "Users can view their own bookings and admins can view all" 
ON availability_bookings FOR SELECT 
USING (
  user_id = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
  )
);

CREATE POLICY "Users can create availability bookings" 
ON availability_bookings FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
  )
);

CREATE POLICY "Users can update their own bookings and admins can update all" 
ON availability_bookings FOR UPDATE 
USING (
  user_id = auth.uid() OR 
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
  )
);

-- Fix authorized_providers RLS policies to resolve 406 errors
DROP POLICY IF EXISTS "Users can read own provider status" ON authorized_providers;
DROP POLICY IF EXISTS "authorized_providers_own_access" ON authorized_providers;

CREATE POLICY "Users can view providers and own provider status" 
ON authorized_providers FOR SELECT 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role IN ('SA', 'AD', 'AP')
  )
);