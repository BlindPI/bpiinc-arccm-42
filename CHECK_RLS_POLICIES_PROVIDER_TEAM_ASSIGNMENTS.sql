-- CHECK: Row Level Security policies on provider_team_assignments table
-- This will show if RLS is blocking the query from the React app

-- 1. Check if RLS is enabled on provider_team_assignments
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    forcerowsecurity as force_rls
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'provider_team_assignments';

-- 2. List all RLS policies on provider_team_assignments
SELECT 
    'RLS POLICIES' as check_type,
    polname as policy_name,
    polcmd as command_type,
    polroles::regrole[] as roles,
    polqual as policy_expression,
    polwithcheck as with_check_expression
FROM pg_policy 
WHERE polrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = 'provider_team_assignments'
);

-- 3. Test direct access as the current user (should work from database)
SELECT 
    'DIRECT DB ACCESS TEST' as check_type,
    COUNT(*) as record_count
FROM provider_team_assignments
WHERE provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND status = 'active';

-- 4. Check what user the React app would be using
SELECT 
    'CURRENT USER CONTEXT' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_role as current_role;