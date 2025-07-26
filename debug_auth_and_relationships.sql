-- COMPREHENSIVE INVESTIGATION: Authentication, Permissions, and Database Relationships
-- Focus Areas: Session corruption, RLS policies, database relationships, data availability

-- ============================================================================
-- 1. AUTHENTICATION SESSION INVESTIGATION
-- ============================================================================

-- Check current auth session and user context
SELECT 
  'CURRENT AUTH CONTEXT' as investigation_area,
  current_user as database_user,
  current_setting('request.jwt.claims') as jwt_claims,
  current_setting('request.jwt.claim.sub') as authenticated_user_id,
  current_setting('request.jwt.claim.role') as authenticated_role;

-- ============================================================================
-- 2. DATABASE RELATIONSHIP INTEGRITY CHECK
-- ============================================================================

-- Check teams -> locations relationship
SELECT 
  'TEAMS-LOCATIONS RELATIONSHIP' as investigation_area,
  COUNT(*) as total_teams,
  COUNT(t.location_id) as teams_with_location,
  COUNT(*) - COUNT(t.location_id) as teams_missing_location,
  COUNT(l.id) as valid_location_references
FROM teams t
LEFT JOIN locations l ON t.location_id = l.id;

-- Check certificate_requests -> teams relationship
SELECT 
  'CERT_REQUESTS-TEAMS RELATIONSHIP' as investigation_area,
  COUNT(*) as total_cert_requests,
  COUNT(cr.team_id) as requests_with_team,
  COUNT(*) - COUNT(cr.team_id) as requests_missing_team,
  COUNT(t.id) as valid_team_references
FROM certificate_requests cr
LEFT JOIN teams t ON cr.team_id = t.id;

-- Check team_members -> profiles relationship
SELECT 
  'TEAM_MEMBERS-PROFILES RELATIONSHIP' as investigation_area,
  COUNT(*) as total_team_members,
  COUNT(tm.user_id) as members_with_user,
  COUNT(*) - COUNT(tm.user_id) as members_missing_user,
  COUNT(p.id) as valid_profile_references
FROM team_members tm
LEFT JOIN profiles p ON tm.user_id = p.id;

-- Check profiles -> auth.users relationship
SELECT 
  'PROFILES-AUTH_USERS RELATIONSHIP' as investigation_area,
  COUNT(*) as total_profiles,
  COUNT(p.id) as profiles_with_id,
  COUNT(au.id) as valid_auth_references
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;

-- ============================================================================
-- 3. ORPHANED RECORDS DETECTION
-- ============================================================================

-- Orphaned certificate_requests (no team)
SELECT 
  'ORPHANED CERTIFICATE_REQUESTS' as issue_type,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at DESC LIMIT 5) as sample_ids
FROM certificate_requests 
WHERE team_id IS NULL OR team_id NOT IN (SELECT id FROM teams);

-- Orphaned team_members (no profile)
SELECT 
  'ORPHANED TEAM_MEMBERS' as issue_type,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at DESC LIMIT 5) as sample_ids
FROM team_members 
WHERE user_id IS NULL OR user_id NOT IN (SELECT id FROM profiles);

-- Teams without locations
SELECT 
  'TEAMS WITHOUT LOCATIONS' as issue_type,
  COUNT(*) as count,
  array_agg(id ORDER BY created_at DESC LIMIT 5) as sample_ids
FROM teams 
WHERE location_id IS NULL OR location_id NOT IN (SELECT id FROM locations);

-- ============================================================================
-- 4. COMPREHENSIVE RLS POLICY REVIEW
-- ============================================================================

-- Document all RLS policies on critical tables
SELECT 
  'RLS POLICIES OVERVIEW' as investigation_area,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('certificates', 'certificate_requests', 'profiles', 'team_members', 'teams', 'locations')
ORDER BY tablename, policyname;

-- Check RLS status on critical tables
SELECT 
  'RLS STATUS' as investigation_area,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('certificates', 'certificate_requests', 'profiles', 'team_members', 'teams', 'locations')
ORDER BY tablename;

-- ============================================================================
-- 5. DATA AVAILABILITY VALIDATION
-- ============================================================================

-- Check data completeness in critical tables
SELECT 'CERTIFICATES TABLE' as table_name, COUNT(*) as total_records FROM certificates
UNION ALL
SELECT 'CERTIFICATE_REQUESTS TABLE', COUNT(*) FROM certificate_requests
UNION ALL
SELECT 'PROFILES TABLE', COUNT(*) FROM profiles
UNION ALL
SELECT 'TEAM_MEMBERS TABLE', COUNT(*) FROM team_members
UNION ALL
SELECT 'TEAMS TABLE', COUNT(*) FROM teams
UNION ALL
SELECT 'LOCATIONS TABLE', COUNT(*) FROM locations;

-- Check for empty critical data that should exist
SELECT 
  'DATA COMPLETENESS CHECK' as investigation_area,
  'PROFILES' as table_name,
  COUNT(*) as total,
  COUNT(CASE WHEN display_name IS NULL OR display_name = '' THEN 1 END) as missing_display_name,
  COUNT(CASE WHEN role IS NULL THEN 1 END) as missing_role,
  COUNT(CASE WHEN email IS NULL OR email = '' THEN 1 END) as missing_email
FROM profiles
UNION ALL
SELECT 
  'DATA COMPLETENESS CHECK',
  'TEAMS',
  COUNT(*),
  COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END),
  COUNT(CASE WHEN location_id IS NULL THEN 1 END),
  COUNT(CASE WHEN created_by IS NULL THEN 1 END)
FROM teams;

-- ============================================================================
-- 6. ACCESS PATTERN ANALYSIS
-- ============================================================================

-- Test basic queries that dashboards would use (without RLS bypass)
-- This will help identify which policies are too restrictive

-- Sample certificate requests for current user context
SELECT 
  'CERT_REQUESTS ACCESS TEST' as test_type,
  COUNT(*) as accessible_records
FROM certificate_requests;

-- Sample certificates for current user context  
SELECT 
  'CERTIFICATES ACCESS TEST' as test_type,
  COUNT(*) as accessible_records
FROM certificates;

-- Sample team members for current user context
SELECT 
  'TEAM_MEMBERS ACCESS TEST' as test_type,
  COUNT(*) as accessible_records
FROM team_members;

-- Sample teams for current user context
SELECT 
  'TEAMS ACCESS TEST' as test_type,
  COUNT(*) as accessible_records
FROM teams;

-- ============================================================================
-- 7. SPECIFIC SESSION CORRUPTION PATTERNS
-- ============================================================================

-- Check for users with authentication issues
SELECT 
  'AUTHENTICATION ANOMALIES' as investigation_area,
  p.id,
  p.email,
  p.role,
  p.status,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.created_at as auth_created,
  p.created_at as profile_created,
  CASE 
    WHEN au.id IS NULL THEN 'MISSING_AUTH_USER'
    WHEN p.id IS NULL THEN 'MISSING_PROFILE'
    WHEN au.email_confirmed_at IS NULL THEN 'UNCONFIRMED_EMAIL'
    WHEN p.status != 'active' THEN 'INACTIVE_PROFILE'
    ELSE 'OK'
  END as issue_type
FROM profiles p
FULL OUTER JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL OR p.id IS NULL OR au.email_confirmed_at IS NULL OR p.status != 'active'
ORDER BY p.created_at DESC NULLS LAST
LIMIT 10;

-- ============================================================================
-- 8. DASHBOARD QUERY PATTERN TESTING
-- ============================================================================

-- Test the specific queries mentioned in the task description
-- Check if dashboard is querying wrong tables

-- Test certificate_requests query (mentioned as wrong table)
SELECT 
  'CERT_REQUESTS DASHBOARD QUERY' as test_type,
  cr.id,
  cr.status,
  cr.certificate_type,
  cr.team_id,
  t.name as team_name,
  l.name as location_name
FROM certificate_requests cr
LEFT JOIN teams t ON cr.team_id = t.id
LEFT JOIN locations l ON t.location_id = l.id
LIMIT 5;

-- Test certificates query (mentioned as correct table)
SELECT 
  'CERTIFICATES DASHBOARD QUERY' as test_type,
  c.id,
  c.status,
  c.certificate_type,
  c.team_id,
  t.name as team_name,
  l.name as location_name
FROM certificates c
LEFT JOIN teams t ON c.team_id = t.id
LEFT JOIN locations l ON t.location_id = l.id
LIMIT 5;