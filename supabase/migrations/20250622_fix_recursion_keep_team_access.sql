-- TARGETED FIX: Remove infinite recursion while maintaining team member profile access
-- Issue: Policies referencing profiles table within profiles policies create recursion
-- Solution: Remove circular references, keep team access through non-recursive joins

-- =====================================================================================
-- STEP 1: DROP ONLY THE PROBLEMATIC RECURSIVE POLICIES
-- =====================================================================================

-- These specific policies are causing the recursion (they reference profiles table within profiles policies)
DROP POLICY IF EXISTS "profiles_own_access_secure" ON profiles;
DROP POLICY IF EXISTS "profiles_team_member_access_secure" ON profiles;
DROP POLICY IF EXISTS "profiles_safe_access" ON profiles;
DROP POLICY IF EXISTS "profiles_basic_access" ON profiles;
DROP POLICY IF EXISTS "ap_can_read_team_member_profiles" ON profiles;
DROP POLICY IF EXISTS "users_can_read_own_profile" ON profiles;

-- =====================================================================================
-- STEP 2: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- =====================================================================================

-- Policy 1: Users can access their own profile (no recursion)
CREATE POLICY "profiles_self_access_safe" ON profiles
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 2: Team member access without recursion (direct team_members join only)
CREATE POLICY "profiles_team_access_safe" ON profiles
FOR SELECT 
USING (
  -- Allow access to profiles of users in the same teams
  -- This does NOT reference the profiles table, only team_members
  EXISTS (
    SELECT 1 
    FROM team_members tm1
    JOIN team_members tm2 ON tm1.team_id = tm2.team_id
    WHERE tm1.user_id = auth.uid()
    AND tm2.user_id = profiles.id
    AND tm1.status = 'active'
    AND tm2.status = 'active'
  )
);

-- Policy 3: System admin access using JWT (no table lookups)
CREATE POLICY "profiles_admin_access_safe" ON profiles
FOR ALL 
USING (
  COALESCE(
    (auth.jwt() ->> 'user_role')::text = 'system_admin',
    false
  )
);

-- =====================================================================================
-- STEP 3: ENSURE PROPER PERMISSIONS
-- =====================================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON team_members TO authenticated;

-- =====================================================================================
-- STEP 4: REFRESH SCHEMA
-- =====================================================================================

NOTIFY pgrst, 'reload schema';

-- =====================================================================================
-- COMPLETION MESSAGE
-- =====================================================================================

DO $$
BEGIN
    RAISE NOTICE '
🔧 TARGETED RECURSION FIX COMPLETED

✅ Removed circular policies causing infinite recursion
✅ Self-access: Users can manage their own profile  
✅ Team access: Members can see profiles of teammates
✅ Admin access: System admins have full access
✅ NO circular references or recursive table lookups
✅ Team member names should now display correctly

RESULT: Infinite recursion fixed, team functionality restored.
';
END;
$$;