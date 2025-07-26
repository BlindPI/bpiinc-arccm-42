-- EMERGENCY FIX: Restore team member display name access
-- User is furious - this should be simple!
-- We have UUID, we know display_name is in profiles, just get it!

-- Test the exact query that should work for getting team member profiles
SELECT 
    tm.user_id,
    tm.role as team_role,
    p.display_name,
    p.email,
    p.phone,
    p.job_title
FROM team_members tm
LEFT JOIN profiles p ON p.id = tm.user_id
WHERE tm.team_id = (
    SELECT id FROM teams 
    WHERE name LIKE '%Barrie%' 
    LIMIT 1
)
AND tm.status = 'active';

-- If that doesn't work, try direct profile query with known UUIDs
SELECT 
    id,
    display_name,
    email,
    phone,
    job_title,
    role
FROM profiles 
WHERE id IN (
    SELECT user_id 
    FROM team_members 
    WHERE team_id = (
        SELECT id FROM teams 
        WHERE name LIKE '%Barrie%' 
        LIMIT 1
    )
    AND status = 'active'
);

-- Test if we can get display names for the specific users showing in the modal
SELECT 
    id,
    display_name,
    email,
    substr(id::text, 1, 8) as uuid_prefix
FROM profiles 
WHERE substr(id::text, 1, 8) IN ('9b0c66e5', '0857e517', '4b21c13d', 'a13a5475')
ORDER BY display_name;