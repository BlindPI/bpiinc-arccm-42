-- Check if RLS is blocking teams and locations queries for "The Test User"

-- 1. Test the exact teams query that SimpleDashboardService makes
SELECT 
    'TEAMS QUERY TEST' as test_type,
    id, 
    name, 
    location_id,
    'Should find Barrie First Aid & CPR Training' as expected
FROM teams
WHERE id = 'b71ff364-e876-4caf-9519-03697d015cfc'
AND status = 'active';

-- 2. Test the exact locations query that SimpleDashboardService makes  
SELECT 
    'LOCATIONS QUERY TEST' as test_type,
    id,
    name,
    'Should find Barrie First Aid & CPR Training location' as expected
FROM locations
WHERE id = 'd4bcc036-101f-4339-b5e8-ea4e1347e83a'
AND status = 'ACTIVE';

-- 3. Check RLS policies on teams table
SELECT 
    'TEAMS RLS POLICIES' as check_type,
    polname as policy_name,
    polcmd as command_type
FROM pg_policy 
WHERE polrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = 'teams'
);

-- 4. Check RLS policies on locations table
SELECT 
    'LOCATIONS RLS POLICIES' as check_type,
    polname as policy_name,
    polcmd as command_type
FROM pg_policy 
WHERE polrelid = (
    SELECT oid 
    FROM pg_class 
    WHERE relname = 'locations'
);

-- 5. Check if RLS is enabled on these tables
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    c.relrowsecurity as rls_enabled
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename IN ('teams', 'locations');