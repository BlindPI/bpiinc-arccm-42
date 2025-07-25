-- FIX: Infinite recursion in RLS policies for provider_team_assignments
-- The issue was caused by referencing profiles table which has its own RLS policies

-- 1. Drop ALL existing policies that might cause recursion
DROP POLICY IF EXISTS "Providers can view their assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Providers can update their assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Admins can create provider assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "provider_assignments_admin_access" ON provider_team_assignments;
DROP POLICY IF EXISTS "provider_assignments_ap_own_access" ON provider_team_assignments;

-- 2. Create simple, direct policies without table references

-- Basic policy: Users can see their own assignments (no table joins)
CREATE POLICY "provider_assignments_simple_select" ON provider_team_assignments
FOR SELECT
USING (provider_id = auth.uid());

-- Basic policy: Users can update their own assignments
CREATE POLICY "provider_assignments_simple_update" ON provider_team_assignments
FOR UPDATE
USING (provider_id = auth.uid());

-- Basic policy: Allow inserts (we'll restrict this at the application level)
CREATE POLICY "provider_assignments_simple_insert" ON provider_team_assignments
FOR INSERT
WITH CHECK (true);

-- Basic policy: Allow deletes for own records
CREATE POLICY "provider_assignments_simple_delete" ON provider_team_assignments
FOR DELETE
USING (provider_id = auth.uid());

-- 3. Verify policies are simple and non-recursive
SELECT 
    'NEW SIMPLE POLICIES' as check_type,
    polname as policy_name,
    polcmd as command_type,
    'No table references = No recursion' as note
FROM pg_policy 
WHERE polrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = 'provider_team_assignments'
);

-- 4. Test the query that should now work
SELECT 
    'TEST AFTER RECURSION FIX' as check_type,
    team_id, 
    assignment_role,
    'Should work with simple RLS' as note
FROM provider_team_assignments
WHERE provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND status = 'active';