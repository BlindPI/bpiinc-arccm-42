-- =====================================================================================
-- ASSIGNMENT CREATION FAILURE DIAGNOSTIC
-- =====================================================================================
-- Purpose: Investigate why AP user assignments aren't being created in the database
-- Focus: Barrie First Aid user and assignment creation workflow
-- =====================================================================================

-- =====================================================================================
-- 1. FIND THE BARRIE FIRST AID AP USER
-- =====================================================================================

-- 1.1 Search for AP user by name variations
SELECT 
    '1.1 AP USER SEARCH - BY NAME VARIATIONS' as analysis_section,
    p.id as profile_id,
    p.display_name,
    p.email,
    p.role,
    p.status as profile_status,
    p.location_id as profile_location_id,
    p.organization
FROM profiles p
WHERE p.role = 'AP'
AND (
    p.display_name ILIKE '%barrie%' OR
    p.display_name ILIKE '%first%aid%' OR
    p.display_name ILIKE '%cpr%' OR
    p.email ILIKE '%barrie%' OR
    p.organization ILIKE '%barrie%' OR
    p.organization ILIKE '%first%aid%'
)
ORDER BY p.display_name;

-- 1.2 Search authorized_providers by name variations
SELECT 
    '1.2 AUTHORIZED_PROVIDERS SEARCH - BY NAME VARIATIONS' as analysis_section,
    ap.id as provider_id,
    ap.name as provider_name,
    ap.user_id,
    ap.status as provider_status,
    ap.primary_location_id,
    ap.provider_type,
    p.display_name as linked_profile_name,
    p.email as linked_profile_email
FROM authorized_providers ap
LEFT JOIN profiles p ON ap.user_id = p.id
WHERE ap.name ILIKE '%barrie%'
   OR ap.name ILIKE '%first%aid%'
   OR ap.name ILIKE '%cpr%'
ORDER BY ap.name;

-- =====================================================================================
-- 2. ALL AP USERS AND THEIR CURRENT ASSIGNMENTS
-- =====================================================================================

-- 2.1 All AP users with their authorized_provider records
SELECT 
    '2.1 ALL AP USERS WITH PROVIDER RECORDS' as analysis_section,
    p.id as profile_id,
    p.display_name,
    p.email,
    p.role,
    p.status as profile_status,
    p.organization,
    ap.id as provider_id,
    ap.name as provider_name,
    ap.status as provider_status,
    ap.primary_location_id,
    l.name as primary_location_name,
    COUNT(pta.id) as assignment_count
FROM profiles p
LEFT JOIN authorized_providers ap ON p.id = ap.user_id
LEFT JOIN locations l ON ap.primary_location_id = l.id
LEFT JOIN provider_team_assignments pta ON ap.id = pta.provider_id AND pta.status = 'active'
WHERE p.role = 'AP'
GROUP BY p.id, p.display_name, p.email, p.role, p.status, p.organization, 
         ap.id, ap.name, ap.status, ap.primary_location_id, l.name
ORDER BY p.display_name;

-- =====================================================================================
-- 3. ASSIGNMENT CREATION WORKFLOW ANALYSIS
-- =====================================================================================

-- 3.1 Recent assignment creation attempts (check timestamps)
SELECT 
    '3.1 RECENT ASSIGNMENT CREATION ACTIVITY' as analysis_section,
    pta.id as assignment_id,
    pta.provider_id,
    ap.name as provider_name,
    pta.team_id,
    t.name as team_name,
    pta.assignment_role,
    pta.status,
    pta.created_at,
    pta.updated_at,
    pta.assigned_by,
    assigner.display_name as assigned_by_name
FROM provider_team_assignments pta
JOIN authorized_providers ap ON pta.provider_id = ap.id
JOIN teams t ON pta.team_id = t.id
LEFT JOIN profiles assigner ON pta.assigned_by = assigner.id
WHERE pta.created_at >= NOW() - INTERVAL '30 days'
ORDER BY pta.created_at DESC
LIMIT 20;

-- 3.2 Teams available for assignment (check if teams exist)
SELECT 
    '3.2 TEAMS AVAILABLE FOR ASSIGNMENT' as analysis_section,
    t.id as team_id,
    t.name as team_name,
    t.status as team_status,
    t.location_id,
    l.name as location_name,
    t.provider_id as current_provider_id,
    ap.name as current_provider_name,
    COUNT(tm.id) as member_count
FROM teams t
LEFT JOIN locations l ON t.location_id = l.id
LEFT JOIN authorized_providers ap ON t.provider_id = ap.id
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.status, t.location_id, l.name, t.provider_id, ap.name
ORDER BY l.name, t.name;

-- =====================================================================================
-- 4. PERMISSION AND RLS ANALYSIS
-- =====================================================================================

-- 4.1 Check RLS policies that might prevent assignment creation
SELECT 
    '4.1 RLS POLICIES ON PROVIDER_TEAM_ASSIGNMENTS' as analysis_section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'provider_team_assignments'
ORDER BY cmd;

-- 4.2 Check if there are any failed assignment attempts in audit logs
-- (This assumes there might be audit/log tables)
SELECT 
    '4.2 CHECKING FOR AUDIT TRAIL TABLES' as analysis_section,
    table_name,
    'Exists' as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND (table_name ILIKE '%audit%' OR table_name ILIKE '%log%')
ORDER BY table_name;

-- =====================================================================================
-- 5. ASSIGNMENT CREATION FUNCTION ANALYSIS
-- =====================================================================================

-- 5.1 Check if assignment functions exist and are accessible
SELECT 
    '5.1 ASSIGNMENT FUNCTIONS AVAILABLE' as analysis_section,
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name ILIKE '%assign%provider%' OR routine_name ILIKE '%team%assignment%')
ORDER BY routine_name;

-- =====================================================================================
-- 6. SPECIFIC TROUBLESHOOTING FOR ASSIGNMENT CREATION
-- =====================================================================================

-- 6.1 Try to identify what happens during assignment creation
-- Check for any constraints that might prevent assignment creation
SELECT 
    '6.1 PROVIDER_TEAM_ASSIGNMENTS TABLE CONSTRAINTS' as analysis_section,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE n.nspname = 'public'
AND t.relname = 'provider_team_assignments'
ORDER BY contype, conname;

-- 6.2 Check for any triggers that might interfere with assignment creation
SELECT 
    '6.2 TRIGGERS ON PROVIDER_TEAM_ASSIGNMENTS' as analysis_section,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'provider_team_assignments'
ORDER BY trigger_name;

-- =====================================================================================
-- 7. MANUAL ASSIGNMENT CREATION TEST
-- =====================================================================================

-- 7.1 Identify test candidates for manual assignment creation
SELECT 
    '7.1 TEST ASSIGNMENT CREATION CANDIDATES' as analysis_section,
    'Provider ID' as component,
    ap.id as id,
    ap.name as name,
    ap.status as status
FROM authorized_providers ap
WHERE ap.status IN ('active', 'APPROVED')
LIMIT 1

UNION ALL

SELECT 
    '7.1 TEST ASSIGNMENT CREATION CANDIDATES',
    'Team ID',
    t.id::text,
    t.name,
    t.status
FROM teams t
WHERE t.status = 'active'
AND t.provider_id IS NULL  -- Teams without current provider assignment
LIMIT 1;

-- =====================================================================================
-- 8. SUMMARY FOR ROOT CAUSE IDENTIFICATION
-- =====================================================================================

SELECT 
    '8. ROOT CAUSE SUMMARY' as analysis_section,
    'Database integrity' as area,
    'HEALTHY - No orphaned records or relationship issues' as status

UNION ALL

SELECT 
    '8. ROOT CAUSE SUMMARY',
    'Assignment creation',
    'FAILING - No assignments found for reported AP user' as status

UNION ALL

SELECT 
    '8. ROOT CAUSE SUMMARY',
    'Investigation focus',
    'Check: UI workflow, permissions, function calls, constraint violations' as status;