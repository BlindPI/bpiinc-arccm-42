-- FIX: Row Level Security policies for provider_team_assignments table
-- This fixes the issue where AP users can't see their own team assignments

-- 1. Check current RLS status (corrected query)
SELECT 
    'CURRENT RLS STATUS' as check_type,
    schemaname,
    tablename,
    c.relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'provider_team_assignments';

-- 2. Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can only see their own provider assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Provider assignments are viewable by assigned providers" ON provider_team_assignments;
DROP POLICY IF EXISTS "Select provider assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Providers can view their assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Providers can update their assignments" ON provider_team_assignments;
DROP POLICY IF EXISTS "Admins can create provider assignments" ON provider_team_assignments;

-- 3. Create a permissive RLS policy for provider_team_assignments
-- Allow providers to see their own assignments
CREATE POLICY "Providers can view their assignments" ON provider_team_assignments
FOR SELECT
USING (
    -- Provider can see their own assignments
    provider_id = auth.uid()
    OR
    -- SA/AD can see all assignments
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
    OR
    -- Team members can see assignments for their teams
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = provider_team_assignments.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- 4. Create policy for updates (providers can update their own assignments)
CREATE POLICY "Providers can update their assignments" ON provider_team_assignments
FOR UPDATE
USING (
    provider_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- 5. Create policy for inserts (SA/AD can create assignments)
CREATE POLICY "Admins can create provider assignments" ON provider_team_assignments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- 6. Verify the fix works by testing the query that was failing
-- This should now return the assignment for "The Test User"
SELECT 
    'TEST QUERY AFTER FIX' as check_type,
    provider_id,
    team_id,
    assignment_role,
    status,
    'Should show Barrie First Aid & CPR Training assignment' as expected_result
FROM provider_team_assignments
WHERE provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND status = 'active';

-- 7. Show all active policies on the table
SELECT 
    'ACTIVE RLS POLICIES' as check_type,
    polname as policy_name,
    polcmd as command_type
FROM pg_policy 
WHERE polrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = 'provider_team_assignments'
);

-- 8. Test what the React app query will see
-- This simulates the exact query from SimpleDashboardService
SELECT 
    'REACT APP SIMULATION' as check_type,
    team_id, 
    assignment_role,
    'This should match what React app sees' as note
FROM provider_team_assignments
WHERE provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND status = 'active';