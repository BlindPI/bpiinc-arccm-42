-- RESTORE PROFILE ACCESS FOR AP USERS
-- The rollback disabled RLS completely, breaking member visibility.
-- This creates a simple, working policy for AP users to see team member profiles.

-- Re-enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "team_member_profiles_select" ON profiles;
DROP POLICY IF EXISTS "ap_team_member_access" ON profiles;
DROP POLICY IF EXISTS "users_can_read_own_profile" ON profiles;

-- Create simple, working policies
-- 1. Users can read their own profile
CREATE POLICY "users_can_read_own_profile" ON profiles
FOR SELECT USING (auth.uid() = id);

-- 2. AP users can read profiles of team members in their assigned teams
CREATE POLICY "ap_can_read_team_member_profiles" ON profiles
FOR SELECT USING (
  -- System admins can read all profiles
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('SA', 'AD')
  )
  OR
  -- Users can read their own profile (redundant but safe)
  auth.uid() = profiles.id
  OR
  -- AP users can read profiles of users who are members of teams assigned to their provider
  EXISTS (
    SELECT 1 FROM authorized_providers ap
    JOIN provider_team_assignments pta ON ap.id = pta.provider_id
    JOIN team_members tm ON pta.team_id = tm.team_id
    WHERE ap.user_id = auth.uid()
    AND tm.user_id = profiles.id
    AND pta.status = 'active'
    AND tm.status = 'active'
  )
);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '
🔧 PROFILE ACCESS RESTORED FOR AP USERS

✅ Re-enabled RLS on profiles table
✅ Created simple policy for users to read own profile
✅ Created policy for AP users to read team member profiles
✅ AP users can now see names and data for their team members

RESULT: Team member visibility should be restored for AP users.
';
END;
$$;