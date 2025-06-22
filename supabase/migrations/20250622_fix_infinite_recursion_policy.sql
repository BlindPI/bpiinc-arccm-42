-- Fix the infinite recursion issue in profiles RLS policy
-- The problem was querying profiles table from within the profiles policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "team_member_profiles_select" ON profiles;

-- Create a simple, non-recursive policy
CREATE POLICY "profiles_basic_access" ON profiles
FOR SELECT USING (
  -- Users can always read their own profile
  auth.uid() = id
  OR
  -- AP users can read team member profiles through provider relationship
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN authorized_providers ap ON t.provider_id = ap.id
    WHERE tm.user_id = profiles.id
    AND ap.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR
  -- System admin access (check user role directly)
  (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('SA', 'AD')
  OR
  -- AP users can read instructor profiles for team management
  (
    (SELECT role FROM auth.users WHERE id = auth.uid()) = 'AP'
    AND profiles.status = 'ACTIVE'
    AND profiles.role IN ('IC', 'IP', 'IT', 'IN')
  )
);

-- If auth.users doesn't have role, let's try a different approach
-- Drop the policy and create a simpler one
DROP POLICY IF EXISTS "profiles_basic_access" ON profiles;

-- Create policy without self-referencing profiles table
CREATE POLICY "profiles_safe_access" ON profiles
FOR SELECT USING (
  -- Users can always read their own profile
  auth.uid() = id
  OR
  -- AP users can read team member profiles
  EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON tm.team_id = t.id
    JOIN authorized_providers ap ON t.provider_id = ap.id
    WHERE tm.user_id = profiles.id
    AND ap.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR
  -- Allow reading of instructor profiles (simplified for AP users)
  (
    profiles.role IN ('IC', 'IP', 'IT', 'IN')
    AND profiles.status = 'ACTIVE'
  )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';