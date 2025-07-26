-- ==============================================
-- COMPREHENSIVE DASHBOARD DEBUG ANALYSIS
-- ==============================================

-- 1. VERIFY TEAM MEMBER TO PROFILE RELATIONSHIP
-- Check team members for Barrie First Aid & CPR Training team
SELECT 
  'TEAM_MEMBERS_ANALYSIS' as section,
  tm.user_id,
  tm.role as team_role,
  tm.status as member_status,
  p.display_name,
  p.email,
  p.role as user_role,
  t.name as team_name,
  t.location_id as team_location_id
FROM team_members tm
LEFT JOIN profiles p ON tm.user_id = p.id
LEFT JOIN teams t ON tm.team_id = t.id
WHERE t.name LIKE '%Barrie First Aid%'
ORDER BY tm.created_at DESC;

-- 2. VERIFY ROSTERS AND LOCATION RELATIONSHIPS  
-- Check rosters that should be visible to Barrie First Aid location
SELECT 
  'ROSTERS_LOCATION_ANALYSIS' as section,
  r.id as roster_id,
  r.name as roster_name,
  r.location_id,
  l.name as location_name,
  r.created_by,
  p.display_name as creator_name,
  r.certificate_count,
  r.status as roster_status,
  r.created_at
FROM rosters r
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN profiles p ON r.created_by = p.id
WHERE l.name LIKE '%Barrie%'
   OR r.location_id IN (
     SELECT primary_location_id 
     FROM authorized_providers 
     WHERE user_id IN (
       SELECT id FROM profiles WHERE email LIKE '%barrie%'
     )
   )
ORDER BY r.created_at DESC;

-- 3. VERIFY AP USER LOCATION ASSIGNMENTS
-- Check which locations are assigned to AP users
SELECT 
  'AP_LOCATION_ASSIGNMENTS' as section,
  p.display_name,
  p.email,
  p.role,
  ap.id as provider_id,
  ap.primary_location_id,
  l.name as location_name,
  ap.status as provider_status
FROM profiles p
JOIN authorized_providers ap ON p.id = ap.user_id
LEFT JOIN locations l ON ap.primary_location_id = l.id
WHERE p.role = 'AP'
ORDER BY p.display_name;

-- 4. CHECK ROSTER SUBMISSIONS BY TEAM MEMBERS
-- See if team members have created any rosters
SELECT 
  'ROSTER_SUBMISSIONS_ANALYSIS' as section,
  p.display_name,
  p.email,
  p.role,
  COUNT(r.id) as roster_count,
  STRING_AGG(r.name, ', ') as roster_names
FROM profiles p
LEFT JOIN rosters r ON p.id = r.created_by
WHERE p.id IN (
  SELECT tm.user_id 
  FROM team_members tm 
  JOIN teams t ON tm.team_id = t.id 
  WHERE t.name LIKE '%Barrie First Aid%'
)
GROUP BY p.id, p.display_name, p.email, p.role
ORDER BY roster_count DESC;

-- 5. VERIFY CERTIFICATE TO ROSTER RELATIONSHIPS
-- Check certificates that belong to rosters
SELECT 
  'CERTIFICATE_ROSTER_RELATIONSHIPS' as section,
  r.name as roster_name,
  r.location_id,
  l.name as location_name,
  COUNT(c.id) as actual_certificates,
  r.certificate_count as roster_count_field,
  MIN(c.created_at) as first_cert_date,
  MAX(c.created_at) as last_cert_date
FROM rosters r
LEFT JOIN locations l ON r.location_id = l.id
LEFT JOIN certificates c ON r.id = c.roster_id
WHERE l.name LIKE '%Barrie%'
GROUP BY r.id, r.name, r.location_id, l.name, r.certificate_count
ORDER BY actual_certificates DESC;

-- 6. CHECK RLS POLICIES ON PROFILES TABLE
SELECT 
  'PROFILES_RLS_POLICIES' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
  AND schemaname = 'public';

-- 7. CHECK RLS POLICIES ON ROSTERS TABLE  
SELECT 
  'ROSTERS_RLS_POLICIES' as section,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'rosters'
  AND schemaname = 'public';

-- 8. VERIFY CURRENT USER CONTEXT (run as the AP user)
SELECT 
  'CURRENT_USER_CONTEXT' as section,
  auth.uid() as current_user_id,
  p.display_name,
  p.email,
  p.role,
  ap.primary_location_id,
  l.name as assigned_location
FROM profiles p
LEFT JOIN authorized_providers ap ON p.id = ap.user_id
LEFT JOIN locations l ON ap.primary_location_id = l.id
WHERE p.id = auth.uid();

-- 9. TEST PROFILE ACCESS (simulate team member query)
-- This should show what profiles are accessible from team member context
SELECT 
  'PROFILE_ACCESS_TEST' as section,
  tm.user_id,
  'ATTEMPTING_PROFILE_ACCESS' as status,
  CASE 
    WHEN p.id IS NOT NULL THEN 'ACCESSIBLE'
    ELSE 'BLOCKED_BY_RLS'
  END as access_result,
  p.display_name,
  p.email
FROM team_members tm
LEFT JOIN profiles p ON tm.user_id = p.id
WHERE tm.team_id IN (
  SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%'
)
AND tm.status = 'active'
ORDER BY tm.created_at;

-- 10. TEST ROSTER ACCESS (simulate AP user query)
-- This should show what rosters are accessible to AP user
SELECT 
  'ROSTER_ACCESS_TEST' as section,
  r.id as roster_id,
  r.name as roster_name,
  r.location_id,
  l.name as location_name,
  CASE 
    WHEN r.id IS NOT NULL THEN 'ACCESSIBLE'
    ELSE 'BLOCKED_BY_RLS'
  END as access_result
FROM locations l
LEFT JOIN rosters r ON l.id = r.location_id AND r.status = 'ACTIVE'
WHERE l.id IN (
  SELECT ap.primary_location_id
  FROM authorized_providers ap
  WHERE ap.user_id = auth.uid()
)
ORDER BY r.created_at DESC;