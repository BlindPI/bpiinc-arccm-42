-- CHECK: Verify "The Test User" actual ID and assignments

-- 1. Find "The Test User" actual profile ID
SELECT 
    'THE TEST USER PROFILE' as check_type,
    id,
    display_name,
    email,
    role
FROM profiles 
WHERE display_name ILIKE '%test user%' 
OR email ILIKE '%jonathan.d.e.wood%';

-- 2. Check provider_team_assignments for this exact user ID (45b269a1-eaf9-4e75-b0b4-3baf1e9c905e)
SELECT 
    'PROVIDER ASSIGNMENTS FOR CONSOLE USER ID' as check_type,
    pta.provider_id,
    pta.team_id,
    pta.assignment_role,
    pta.status,
    t.name as team_name
FROM provider_team_assignments pta
JOIN teams t ON pta.team_id = t.id
WHERE pta.provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e'
AND pta.status = 'active';

-- 3. Check ALL provider_team_assignments for "The Test User"
SELECT 
    'ALL PROVIDER ASSIGNMENTS FOR TEST USER' as check_type,
    pta.provider_id,
    pta.team_id,
    pta.assignment_role,
    pta.status,
    t.name as team_name,
    p.display_name as provider_name
FROM provider_team_assignments pta
JOIN teams t ON pta.team_id = t.id
JOIN profiles p ON pta.provider_id = p.id
WHERE p.display_name ILIKE '%test user%'
AND pta.status = 'active';

-- 4. Check if there's an ID mismatch
SELECT 
    'POSSIBLE ID MISMATCH CHECK' as check_type,
    'Console shows: 45b269a1-eaf9-4e75-b0b4-3baf1e9c905e' as console_id,
    p.id as actual_profile_id,
    CASE 
        WHEN p.id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e' THEN 'MATCH' 
        ELSE 'MISMATCH' 
    END as id_comparison
FROM profiles p
WHERE p.display_name ILIKE '%test user%';