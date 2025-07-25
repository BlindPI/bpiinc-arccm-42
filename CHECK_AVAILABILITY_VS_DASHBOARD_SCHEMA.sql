-- Compare what availability calendar gets vs dashboard
-- Find the exact RPC function that works for availability

-- 1. Check the get_user_availability_for_date_range function
SELECT 
    'AVAILABILITY RPC FUNCTION' as check_type,
    routine_name,
    data_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_availability_for_date_range'
AND routine_type = 'FUNCTION';

-- 2. Test what the availability calendar actually gets for "The Test User"
SELECT 
    'AVAILABILITY RPC TEST' as test_type,
    user_id,
    display_name,
    email,
    role,
    'This works - shows Ryan and Sarah' as note
FROM get_user_availability_for_date_range('2025-07-01', '2025-07-31', NULL, '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e', 'AP')
LIMIT 5;

-- 3. Check what team data "The Test User" should have vs what dashboard tries to get
-- Team from provider_team_assignments
SELECT 
    'TEAM FROM PROVIDER_ASSIGNMENTS' as check_type,
    pta.team_id,
    pta.assignment_role,
    t.name as team_name,
    t.location_id,
    l.name as location_name
FROM provider_team_assignments pta
JOIN teams t ON t.id = pta.team_id
JOIN locations l ON l.id = t.location_id
WHERE pta.provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND pta.status = 'active';

-- 4. Check if the availability function accesses teams differently
-- Let's see what team access patterns exist in the availability function
\df+ get_user_availability_for_date_range