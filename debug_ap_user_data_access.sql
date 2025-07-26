-- Debug AP User Data Access Failure
-- Based on recent migrations analysis (July 23-25, 2025)

-- =====================================================
-- 1. CHECK AUTHORIZED_PROVIDERS TABLE STATE
-- =====================================================

-- Check if AP users have authorized_providers records
SELECT 
    'AP Users with authorized_providers records' as check_name,
    COUNT(*) as count
FROM profiles p
LEFT JOIN authorized_providers ap ON ap.user_id = p.id
WHERE p.role = 'AP' AND ap.id IS NOT NULL;

SELECT 
    'AP Users WITHOUT authorized_providers records' as check_name,
    COUNT(*) as count
FROM profiles p
LEFT JOIN authorized_providers ap ON ap.user_id = p.id
WHERE p.role = 'AP' AND ap.id IS NULL;

-- Show specific AP users missing provider records
SELECT 
    p.id,
    p.display_name,
    p.email,
    p.role,
    ap.id as provider_id,
    ap.status as provider_status
FROM profiles p
LEFT JOIN authorized_providers ap ON ap.user_id = p.id
WHERE p.role = 'AP'
ORDER BY p.display_name;

-- =====================================================
-- 2. CHECK PROVIDER_TEAM_ASSIGNMENTS TABLE
-- =====================================================

-- Check if authorized_providers have team assignments
SELECT 
    'Authorized providers with team assignments' as check_name,
    COUNT(*) as count
FROM authorized_providers ap
INNER JOIN provider_team_assignments pta ON pta.provider_id = ap.id
WHERE ap.status = 'APPROVED';

SELECT 
    'Authorized providers WITHOUT team assignments' as check_name,
    COUNT(*) as count
FROM authorized_providers ap
LEFT JOIN provider_team_assignments pta ON pta.provider_id = ap.id
WHERE ap.status = 'APPROVED' AND pta.id IS NULL;

-- Show specific provider-team assignment gaps
SELECT 
    ap.id as provider_id,
    ap.name as provider_name,
    ap.user_id,
    p.display_name as user_name,
    pta.team_id,
    t.name as team_name,
    pta.status as assignment_status
FROM authorized_providers ap
JOIN profiles p ON p.id = ap.user_id
LEFT JOIN provider_team_assignments pta ON pta.provider_id = ap.id
LEFT JOIN teams t ON t.id = pta.team_id
WHERE p.role = 'AP'
ORDER BY ap.name;

-- =====================================================
-- 3. CHECK TEAM_AVAILABILITY_PERMISSIONS TABLE  
-- =====================================================

-- Check if AP users have team availability permissions
SELECT 
    'AP users with team availability permissions' as check_name,
    COUNT(DISTINCT tap.manager_id) as count
FROM team_availability_permissions tap
JOIN profiles p ON p.id = tap.manager_id
WHERE p.role = 'AP';

SELECT 
    'AP users WITHOUT team availability permissions' as check_name,
    COUNT(*) as count
FROM profiles p
LEFT JOIN team_availability_permissions tap ON tap.manager_id = p.id
WHERE p.role = 'AP' AND tap.id IS NULL;

-- =====================================================
-- 4. CHECK TEAM MEMBERSHIP FOR AP USERS
-- =====================================================

-- Show AP users and their team memberships
SELECT 
    p.id as user_id,
    p.display_name,
    p.email,
    tm.team_id,
    t.name as team_name,
    tm.status as member_status,
    tm.role as team_role
FROM profiles p
LEFT JOIN team_members tm ON tm.user_id = p.id
LEFT JOIN teams t ON t.id = tm.team_id
WHERE p.role = 'AP'
ORDER BY p.display_name;

-- =====================================================
-- 5. CHECK DATA CONSISTENCY ISSUES
-- =====================================================

-- Find AP users who are team members but missing provider records
SELECT 
    'AP users in teams but missing authorized_providers records' as issue,
    p.id,
    p.display_name,
    t.name as team_name
FROM profiles p
JOIN team_members tm ON tm.user_id = p.id
JOIN teams t ON t.id = tm.team_id
LEFT JOIN authorized_providers ap ON ap.user_id = p.id
WHERE p.role = 'AP' 
AND tm.status = 'active'
AND ap.id IS NULL;

-- Find authorized_providers missing team assignments for active team members
SELECT 
    'Authorized providers missing team assignments despite team membership' as issue,
    ap.id as provider_id,
    ap.name as provider_name,
    p.display_name as user_name,
    t.name as team_name
FROM authorized_providers ap
JOIN profiles p ON p.id = ap.user_id
JOIN team_members tm ON tm.user_id = p.id
JOIN teams t ON t.id = tm.team_id
LEFT JOIN provider_team_assignments pta ON pta.provider_id = ap.id AND pta.team_id = t.id
WHERE p.role = 'AP'
AND tm.status = 'active'
AND ap.status = 'APPROVED'
AND pta.id IS NULL;

-- =====================================================
-- 6. SUMMARY OF CRITICAL GAPS
-- =====================================================

-- Comprehensive summary of AP user data access issues
WITH ap_users AS (
    SELECT id, display_name, email FROM profiles WHERE role = 'AP'
),
provider_status AS (
    SELECT 
        au.id as user_id,
        au.display_name,
        CASE WHEN ap.id IS NOT NULL THEN 'HAS_PROVIDER' ELSE 'MISSING_PROVIDER' END as provider_status
    FROM ap_users au
    LEFT JOIN authorized_providers ap ON ap.user_id = au.id AND ap.status = 'APPROVED'
),
team_status AS (
    SELECT 
        au.id as user_id,
        au.display_name,
        CASE WHEN tm.id IS NOT NULL THEN 'HAS_TEAM' ELSE 'NO_TEAM' END as team_status,
        COUNT(tm.id) as team_count
    FROM ap_users au
    LEFT JOIN team_members tm ON tm.user_id = au.id AND tm.status = 'active'
    GROUP BY au.id, au.display_name
),
assignment_status AS (
    SELECT 
        au.id as user_id,
        au.display_name,
        CASE WHEN pta.id IS NOT NULL THEN 'HAS_ASSIGNMENTS' ELSE 'NO_ASSIGNMENTS' END as assignment_status,
        COUNT(pta.id) as assignment_count
    FROM ap_users au
    LEFT JOIN authorized_providers ap ON ap.user_id = au.id
    LEFT JOIN provider_team_assignments pta ON pta.provider_id = ap.id AND pta.status = 'active'
    GROUP BY au.id, au.display_name
),
SELECT 
    ps.user_id,
    ps.display_name,
    ps.provider_status,
    ts.team_status,
    ts.team_count,
    as_stat.assignment_status,
    as_stat.assignment_count,
    CASE 
        WHEN ps.provider_status = 'MISSING_PROVIDER' THEN 'CRITICAL: Missing authorized_provider record'
        WHEN ts.team_status = 'NO_TEAM' THEN 'WARNING: Not assigned to any team'
        WHEN as_stat.assignment_status = 'NO_ASSIGNMENTS' THEN 'CRITICAL: Missing provider_team_assignments'
        ELSE 'OK: Has required records'
    END as diagnosis
FROM provider_status ps
JOIN team_status ts ON ts.user_id = ps.user_id
JOIN assignment_status as_stat ON as_stat.user_id = ps.user_id
ORDER BY ps.display_name;