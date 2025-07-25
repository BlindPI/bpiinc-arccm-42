-- RUN ALL DEBUG QUERIES FOR "The Test User"

-- 1. Find "The Test User" profile
SELECT 
  'USER PROFILE' as check_type,
  p.id as user_id,
  p.display_name,
  p.email,
  p.role
FROM profiles p
WHERE p.display_name ILIKE '%test user%'
OR p.email ILIKE '%jonathan.d.e.wood%';

-- 2. Check provider_team_assignments for "The Test User"
SELECT 
  'PROVIDER ASSIGNMENTS' as check_type,
  pta.provider_id,
  pta.team_id,
  pta.assignment_role,
  pta.status,
  t.name as team_name,
  l.name as location_name
FROM provider_team_assignments pta
JOIN teams t ON pta.team_id = t.id
JOIN locations l ON t.location_id = l.id
JOIN profiles p ON pta.provider_id = p.id
WHERE p.display_name ILIKE '%test user%'
OR p.email ILIKE '%jonathan.d.e.wood%';

-- 3. Check team_members for "The Test User"
SELECT 
  'TEAM MEMBERS' as check_type,
  tm.user_id,
  tm.team_id,
  tm.role,
  tm.status,
  t.name as team_name,
  l.name as location_name
FROM team_members tm
JOIN teams t ON tm.team_id = t.id
JOIN locations l ON t.location_id = l.id
JOIN profiles p ON tm.user_id = p.id
WHERE p.display_name ILIKE '%test user%'
OR p.email ILIKE '%jonathan.d.e.wood%';

-- 4. Check if "The Test User" should be assigned to "Barrie First Aid and CPR Training"
SELECT 
  'EXPECTED BARRIE ASSIGNMENT' as check_type,
  t.id as barrie_team_id,
  t.name as team_name,
  l.name as location_name
FROM teams t
JOIN locations l ON t.location_id = l.id
WHERE t.name ILIKE '%barrie%';