-- EXAMINE ACTUAL TABLE STRUCTURES
-- Fix the column issues discovered in the previous query

-- ============================================================================
-- 1. EXAMINE ACTUAL TABLE SCHEMAS
-- ============================================================================

-- Check certificate_requests table structure
SELECT 
  'CERTIFICATE_REQUESTS_SCHEMA' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'certificate_requests' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check certificates table structure  
SELECT 
  'CERTIFICATES_SCHEMA' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'certificates' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check teams table structure
SELECT 
  'TEAMS_SCHEMA' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'teams' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check team_members table structure
SELECT 
  'TEAM_MEMBERS_SCHEMA' as table_info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'team_members' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. CORRECTED DASHBOARD QUERY TESTS
-- ============================================================================

-- Test certificate_requests query with correct columns
SELECT 
  'CERT_REQUESTS_CORRECTED_QUERY' as test_type,
  cr.id,
  cr.status,
  cr.certificate_type,
  cr.user_id,
  p.display_name as user_name,
  p.email as user_email
FROM certificate_requests cr
LEFT JOIN profiles p ON cr.user_id = p.id
LIMIT 5;

-- Test certificates query with correct columns
SELECT 
  'CERTIFICATES_CORRECTED_QUERY' as test_type,
  c.id,
  c.status,
  c.certificate_type,
  c.user_id,
  c.issued_by,
  p.display_name as user_name,
  p.email as user_email
FROM certificates c
LEFT JOIN profiles p ON c.user_id = p.id
LIMIT 5;

-- ============================================================================
-- 3. TEAM RELATIONSHIP ANALYSIS
-- ============================================================================

-- Check how teams relate to users/certificates
-- Look for team assignments through team_members
SELECT 
  'TEAM_USER_RELATIONSHIPS' as analysis_type,
  tm.id as team_member_id,
  tm.team_id,
  tm.user_id,
  t.name as team_name,
  t.location_id,
  l.name as location_name,
  p.display_name as user_name,
  p.email as user_email
FROM team_members tm
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN locations l ON t.location_id = l.id
LEFT JOIN profiles p ON tm.user_id = p.id
ORDER BY tm.team_id, tm.user_id
LIMIT 10;

-- ============================================================================
-- 4. CHECK FOR MISSING RLS ON CRITICAL TABLES
-- ============================================================================

-- Document tables without RLS that should have it
SELECT 
  'MISSING_RLS_TABLES' as security_issue,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN tablename IN ('teams', 'team_members') AND NOT rowsecurity THEN 'CRITICAL: No RLS on team data'
    WHEN tablename IN ('profiles') AND NOT rowsecurity THEN 'CRITICAL: No RLS on profile data'
    ELSE 'OK'
  END as security_risk
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('teams', 'team_members', 'profiles', 'certificates', 'certificate_requests', 'locations')
ORDER BY 
  CASE WHEN NOT rowsecurity THEN 0 ELSE 1 END,
  tablename;

-- ============================================================================
-- 5. ANALYZE RLS POLICY CONFLICTS
-- ============================================================================

-- Find conflicting or duplicate policies on same table/command
WITH policy_analysis AS (
  SELECT 
    tablename,
    cmd,
    COUNT(*) as policy_count,
    array_agg(policyname ORDER BY policyname) as policy_names
  FROM pg_policies 
  WHERE tablename IN ('certificates', 'certificate_requests', 'locations')
  GROUP BY tablename, cmd
)
SELECT 
  'RLS_POLICY_CONFLICTS' as analysis_type,
  tablename,
  cmd,
  policy_count,
  CASE 
    WHEN policy_count > 3 THEN 'HIGH: Too many policies may conflict'
    WHEN policy_count > 1 THEN 'MEDIUM: Multiple policies need review'
    ELSE 'OK'
  END as conflict_risk,
  policy_names
FROM policy_analysis
WHERE policy_count > 1
ORDER BY policy_count DESC, tablename, cmd;

-- ============================================================================
-- 6. VERIFY DATA ACCESS PATTERNS
-- ============================================================================

-- Test if current session can access team data properly
SELECT 
  'TEAM_ACCESS_VERIFICATION' as test_type,
  COUNT(*) as accessible_teams,
  COUNT(CASE WHEN location_id IS NOT NULL THEN 1 END) as teams_with_locations,
  COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as teams_with_creators
FROM teams;

-- Test team member access
SELECT 
  'TEAM_MEMBER_ACCESS_VERIFICATION' as test_type,
  COUNT(*) as accessible_team_members,
  COUNT(DISTINCT team_id) as unique_teams_referenced,
  COUNT(DISTINCT user_id) as unique_users_referenced
FROM team_members;