-- INVESTIGATE HOW CERTIFICATES RELATE TO TEAMS
-- Since certificates/certificate_requests don't have team_id columns

-- ============================================================================
-- 1. CERTIFICATE TO TEAM RELATIONSHIP ANALYSIS
-- ============================================================================

-- How to connect certificates to teams through users
WITH cert_team_connections AS (
  SELECT 
    c.id as certificate_id,
    c.user_id,
    c.recipient_name,
    c.course_name,
    c.status as cert_status,
    tm.team_id,
    t.name as team_name,
    l.name as location_name,
    p.display_name as user_name,
    p.email as user_email
  FROM certificates c
  LEFT JOIN team_members tm ON c.user_id = tm.user_id
  LEFT JOIN teams t ON tm.team_id = t.id
  LEFT JOIN locations l ON t.location_id = l.id
  LEFT JOIN profiles p ON c.user_id = p.id
)
SELECT 
  'CERTIFICATE_TEAM_MAPPING' as analysis_type,
  COUNT(*) as total_certificates,
  COUNT(team_id) as certificates_with_teams,
  COUNT(*) - COUNT(team_id) as certificates_without_teams,
  COUNT(DISTINCT team_id) as unique_teams_with_certs,
  COUNT(DISTINCT user_id) as unique_users_with_certs
FROM cert_team_connections;

-- Sample certificate-team connections
WITH cert_team_connections AS (
  SELECT 
    c.id as certificate_id,
    c.user_id,
    c.recipient_name,
    c.course_name,
    c.status as cert_status,
    tm.team_id,
    t.name as team_name,
    l.name as location_name,
    p.display_name as user_name,
    p.email as user_email
  FROM certificates c
  LEFT JOIN team_members tm ON c.user_id = tm.user_id
  LEFT JOIN teams t ON tm.team_id = t.id
  LEFT JOIN locations l ON t.location_id = l.id
  LEFT JOIN profiles p ON c.user_id = p.id
)
SELECT 
  'SAMPLE_CERT_TEAM_CONNECTIONS' as sample_type,
  certificate_id,
  recipient_name,
  course_name,
  team_name,
  location_name,
  user_name,
  user_email
FROM cert_team_connections
WHERE team_id IS NOT NULL
LIMIT 10;

-- ============================================================================
-- 2. DASHBOARD DATA AVAILABILITY ISSUES
-- ============================================================================

-- Check for users with certificates but no team assignment
WITH orphaned_certs AS (
  SELECT 
    c.id as certificate_id,
    c.user_id,
    c.recipient_name,
    c.course_name,
    p.display_name as user_name,
    p.email as user_email,
    CASE 
      WHEN tm.user_id IS NULL THEN 'USER_NOT_IN_ANY_TEAM'
      WHEN t.id IS NULL THEN 'TEAM_MISSING'
      WHEN l.id IS NULL THEN 'LOCATION_MISSING'
      ELSE 'OK'
    END as issue_type
  FROM certificates c
  LEFT JOIN profiles p ON c.user_id = p.id
  LEFT JOIN team_members tm ON c.user_id = tm.user_id
  LEFT JOIN teams t ON tm.team_id = t.id
  LEFT JOIN locations l ON t.location_id = l.id
)
SELECT 
  'ORPHANED_CERTIFICATES' as analysis_type,
  issue_type,
  COUNT(*) as count,
  array_agg(certificate_id ORDER BY certificate_id LIMIT 5) as sample_certificate_ids
FROM orphaned_certs
WHERE issue_type != 'OK'
GROUP BY issue_type
ORDER BY count DESC;

-- ============================================================================
-- 3. AUTHENTICATION AND ACCESS PATTERN TESTING
-- ============================================================================

-- Test RLS policies with different access patterns
-- Simulate what happens when dashboard tries to access team-level certificate data

-- Check if current user can see certificates by team
SELECT 
  'TEAM_CERTIFICATE_ACCESS_TEST' as test_type,
  t.name as team_name,
  COUNT(c.id) as accessible_certificates,
  COUNT(DISTINCT c.user_id) as unique_users_with_certs
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
LEFT JOIN certificates c ON tm.user_id = c.user_id
GROUP BY t.id, t.name
ORDER BY accessible_certificates DESC;

-- ============================================================================
-- 4. AUTHENTICATION SESSION CORRELATION WITH DATA ACCESS
-- ============================================================================

-- Check if authentication issues correlate with data visibility problems
SELECT 
  'AUTH_DATA_CORRELATION' as analysis_type,
  p.status as profile_status,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.last_sign_in_at IS NOT NULL as has_signed_in,
  COUNT(c.id) as certificate_count,
  COUNT(tm.id) as team_membership_count,
  COUNT(DISTINCT tm.team_id) as teams_count
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN certificates c ON p.id = c.user_id
LEFT JOIN team_members tm ON p.id = tm.user_id
GROUP BY p.status, (au.email_confirmed_at IS NOT NULL), (au.last_sign_in_at IS NOT NULL)
ORDER BY certificate_count DESC;

-- ============================================================================
-- 5. LOCATION-BASED ACCESS PATTERNS
-- ============================================================================

-- Check if certificates can be accessed by location (common dashboard requirement)
WITH location_certs AS (
  SELECT 
    l.id as location_id,
    l.name as location_name,
    c.id as certificate_id,
    c.recipient_name,
    c.course_name,
    c.status as cert_status,
    t.name as team_name,
    p.display_name as user_name
  FROM locations l
  LEFT JOIN teams t ON l.id = t.location_id
  LEFT JOIN team_members tm ON t.id = tm.team_id
  LEFT JOIN certificates c ON tm.user_id = c.user_id
  LEFT JOIN profiles p ON c.user_id = p.id
)
SELECT 
  'LOCATION_CERTIFICATE_ACCESS' as analysis_type,
  location_name,
  COUNT(certificate_id) as certificate_count,
  COUNT(DISTINCT team_name) as teams_count,
  COUNT(DISTINCT user_name) as users_count
FROM location_certs
GROUP BY location_id, location_name
ORDER BY certificate_count DESC;

-- ============================================================================
-- 6. SPECIFIC AUTHENTICATION CORRELATION
-- ============================================================================

-- Check specific users mentioned in authentication anomalies
SELECT 
  'SPECIFIC_AUTH_ISSUES' as analysis_type,
  p.id,
  p.display_name,
  p.email,
  p.status as profile_status,
  au.email_confirmed_at IS NOT NULL as email_confirmed,
  au.last_sign_in_at,
  COUNT(c.id) as certificate_count,
  COUNT(tm.id) as team_memberships,
  CASE 
    WHEN au.email_confirmed_at IS NULL THEN 'UNCONFIRMED_EMAIL'
    WHEN p.status != 'ACTIVE' THEN 'INACTIVE_PROFILE'
    WHEN au.last_sign_in_at IS NULL THEN 'NEVER_SIGNED_IN'
    ELSE 'OK'
  END as auth_issue
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
LEFT JOIN certificates c ON p.id = c.user_id
LEFT JOIN team_members tm ON p.id = tm.user_id
WHERE au.email_confirmed_at IS NULL 
   OR p.status != 'ACTIVE' 
   OR au.last_sign_in_at IS NULL
GROUP BY p.id, p.display_name, p.email, p.status, au.email_confirmed_at, au.last_sign_in_at
ORDER BY certificate_count DESC;