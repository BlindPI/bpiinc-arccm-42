-- DEBUG: Check "The Test User" assignments and data flow
-- This query will help us understand why "The Test User" is still showing "BPI INC 2"

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
  pta.created_at,
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

-- 4. Check authorized_providers for "The Test User"
SELECT 
  'AUTHORIZED PROVIDERS' as check_type,
  ap.id,
  ap.provider_name,
  ap.contact_email,
  ap.status,
  p.display_name as profile_name
FROM authorized_providers ap
LEFT JOIN profiles p ON ap.id = p.id
WHERE ap.provider_name ILIKE '%test user%'
OR ap.contact_email ILIKE '%jonathan.d.e.wood%'
OR p.display_name ILIKE '%test user%';

-- 5. Check what team "BPI INC 2" actually is
SELECT 
  'BPI INC 2 TEAM DETAILS' as check_type,
  t.id as team_id,
  t.name as team_name,
  t.provider_id,
  l.name as location_name,
  ap.provider_name,
  ap.contact_email
FROM teams t
JOIN locations l ON t.location_id = l.id
LEFT JOIN authorized_providers ap ON t.provider_id = ap.id
WHERE t.name ILIKE '%bpi inc 2%';

-- 6. Check if there are any assignments that should point to "Barrie First Aid and CPR Training"
SELECT 
  'BARRIE ASSIGNMENTS' as check_type,
  pta.provider_id,
  p.display_name as provider_name,
  pta.team_id,
  t.name as team_name,
  pta.assignment_role,
  pta.status
FROM provider_team_assignments pta
JOIN profiles p ON pta.provider_id = p.id
JOIN teams t ON pta.team_id = t.id
WHERE t.name ILIKE '%barrie%'
OR p.display_name ILIKE '%test user%';