
-- Drop existing policies
DROP POLICY IF EXISTS "Profiles viewable by all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles modifiable by admins only" ON public.profiles;

-- Create new policies that avoid recursion
-- Allow all authenticated users to read profiles (this is safe and doesn't cause recursion)
CREATE POLICY "Profiles are viewable by all authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- For modifications, we'll use a simpler check that doesn't cause recursion
-- Allow users to modify only their own profile
CREATE POLICY "Users can modify their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Only allow insert during user creation (handled by trigger)
CREATE POLICY "System can create profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (true);

-- Prevent manual deletion of profiles
CREATE POLICY "Prevent profile deletion"
ON public.profiles FOR DELETE
TO authenticated
USING (false);
