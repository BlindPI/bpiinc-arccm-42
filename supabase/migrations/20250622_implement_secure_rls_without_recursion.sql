-- IMPLEMENT SECURE RLS POLICIES WITHOUT RECURSION
-- This restores proper security while avoiding infinite loops

-- =====================================================================================
-- STEP 1: CREATE SECURE PROFILES ACCESS WITHOUT RECURSION
-- =====================================================================================

-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can access their own profile (no recursion)
CREATE POLICY "profiles_own_access_secure" ON profiles
FOR ALL USING (auth.uid() = id);

-- Policy 2: Simple read access for team relationships (no role checking to avoid recursion)
CREATE POLICY "profiles_team_member_access_secure" ON profiles
FOR SELECT USING (
  -- Allow reading profiles for users in the same teams
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

-- =====================================================================================
-- STEP 2: RESTORE BASIC PERMISSIONS
-- =====================================================================================

-- Grant basic read access to profiles
GRANT SELECT ON profiles TO authenticated;

-- =====================================================================================
-- STEP 3: REFRESH SCHEMA
-- =====================================================================================

NOTIFY pgrst, 'reload schema';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '
🔒 SECURE RLS POLICIES IMPLEMENTED WITHOUT RECURSION

✅ Profiles RLS re-enabled with secure, non-recursive policies
✅ Users can access own profile
✅ Team members can see profiles of other team members  
✅ No infinite recursion loops
✅ Maintains security while ensuring functionality

RESULT: Secure profile access restored for AP team management.
';
END;
$$;