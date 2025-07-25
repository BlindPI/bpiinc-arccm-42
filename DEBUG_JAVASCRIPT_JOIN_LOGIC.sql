-- The issue is NOT RLS - the data is accessible
-- Let's see exactly what the service should be getting at each step

-- 1. What teamMemberships array should contain (from console logs)
SELECT 
    'TEAM_MEMBERSHIPS SHOULD BE' as step,
    team_id,
    'primary' as role,
    'manager' as relationship_type
FROM provider_team_assignments 
WHERE provider_id = '45b269a1-eaf9-4e75-b0b4-3baf1e9c905e' 
AND status = 'active';

-- 2. What teams query should return
SELECT 
    'TEAMS QUERY SHOULD RETURN' as step,
    id,
    name,
    location_id
FROM teams 
WHERE id = 'b71ff364-e876-4caf-9519-03697d015cfc'
AND status = 'active';

-- 3. What locations query should return
SELECT 
    'LOCATIONS QUERY SHOULD RETURN' as step,
    id,
    name
FROM locations 
WHERE id = 'd4bcc036-101f-4339-b5e8-ea4e1347e83a'
AND status = 'ACTIVE';

-- 4. What the final join should produce
SELECT 
    'FINAL JOIN SHOULD PRODUCE' as step,
    t.id as team_id,
    t.name as team_name,
    'primary' as team_role,
    t.location_id,
    l.name as location_name,
    0 as certificate_count
FROM teams t
JOIN locations l ON l.id = t.location_id
WHERE t.id = 'b71ff364-e876-4caf-9519-03697d015cfc'
AND t.status = 'active'
AND l.status = 'ACTIVE';