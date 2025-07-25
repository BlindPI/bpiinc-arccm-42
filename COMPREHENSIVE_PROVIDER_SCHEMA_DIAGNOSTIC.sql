-- =====================================================================================
-- COMPREHENSIVE PROVIDER MANAGEMENT SCHEMA DIAGNOSTIC
-- =====================================================================================
-- Purpose: Analyze current database state for provider-team-location relationships
-- Run this in Supabase SQL Editor to get complete picture of schema and data integrity
-- =====================================================================================

-- =====================================================================================
-- 1. TABLE STRUCTURES AND COLUMNS
-- =====================================================================================

-- 1.1 TEAMS TABLE STRUCTURE
SELECT 
    '1.1 TEAMS TABLE STRUCTURE' as analysis_section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'teams'
ORDER BY ordinal_position;

-- 1.2 AUTHORIZED_PROVIDERS TABLE STRUCTURE  
SELECT 
    '1.2 AUTHORIZED_PROVIDERS TABLE STRUCTURE' as analysis_section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'authorized_providers'
ORDER BY ordinal_position;

-- 1.3 PROVIDER_TEAM_ASSIGNMENTS TABLE STRUCTURE
SELECT 
    '1.3 PROVIDER_TEAM_ASSIGNMENTS TABLE STRUCTURE' as analysis_section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'provider_team_assignments'
ORDER BY ordinal_position;

-- 1.4 PROFILES TABLE STRUCTURE (AP USERS)
SELECT 
    '1.4 PROFILES TABLE STRUCTURE (AP USERS)' as analysis_section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 1.5 LOCATIONS TABLE STRUCTURE
SELECT 
    '1.5 LOCATIONS TABLE STRUCTURE' as analysis_section,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'locations'
ORDER BY ordinal_position;

-- =====================================================================================
-- 2. FOREIGN KEY RELATIONSHIPS
-- =====================================================================================

SELECT 
    '2. FOREIGN KEY RELATIONSHIPS' as analysis_section,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name as target_table,
    ccu.column_name as target_column,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND (tc.table_name IN ('teams', 'authorized_providers', 'provider_team_assignments', 'profiles', 'locations') 
     OR ccu.table_name IN ('teams', 'authorized_providers', 'provider_team_assignments', 'profiles', 'locations'))
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================================================

SELECT 
    '3. RELEVANT INDEXES' as analysis_section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('teams', 'authorized_providers', 'provider_team_assignments', 'profiles', 'locations')
ORDER BY tablename, indexname;

-- =====================================================================================
-- 4. CURRENT DATA COUNTS AND RELATIONSHIPS
-- =====================================================================================

-- 4.1 BASIC TABLE COUNTS
SELECT 
    '4.1 BASIC TABLE COUNTS' as analysis_section,
    'profiles' as table_name, 
    COUNT(*) as total_records 
FROM profiles
UNION ALL
SELECT 
    '4.1 BASIC TABLE COUNTS',
    'authorized_providers', 
    COUNT(*) 
FROM authorized_providers  
UNION ALL
SELECT 
    '4.1 BASIC TABLE COUNTS',
    'teams', 
    COUNT(*) 
FROM teams
UNION ALL
SELECT 
    '4.1 BASIC TABLE COUNTS',
    'provider_team_assignments', 
    COUNT(*) 
FROM provider_team_assignments
UNION ALL
SELECT 
    '4.1 BASIC TABLE COUNTS',
    'locations', 
    COUNT(*) 
FROM locations;

-- 4.2 PROFILES BY ROLE
SELECT 
    '4.2 PROFILES BY ROLE' as analysis_section,
    role,
    status,
    COUNT(*) as count
FROM profiles 
GROUP BY role, status
ORDER BY role, status;

-- 4.3 AUTHORIZED_PROVIDERS BY STATUS
SELECT 
    '4.3 AUTHORIZED_PROVIDERS BY STATUS' as analysis_section,
    status,
    provider_type,
    COUNT(*) as count
FROM authorized_providers 
GROUP BY status, provider_type
ORDER BY status, provider_type;

-- 4.4 PROVIDER_TEAM_ASSIGNMENTS BY STATUS
SELECT 
    '4.4 PROVIDER_TEAM_ASSIGNMENTS BY STATUS' as analysis_section,
    status,
    assignment_role,
    COUNT(*) as count
FROM provider_team_assignments 
GROUP BY status, assignment_role
ORDER BY status, assignment_role;

-- =====================================================================================
-- 5. RELATIONSHIP INTEGRITY ANALYSIS
-- =====================================================================================

-- 5.1 ORPHANED TEAMS (teams.provider_id not in authorized_providers)
SELECT 
    '5.1 ORPHANED TEAMS' as analysis_section,
    t.id as team_id,
    t.name as team_name,
    t.provider_id,
    t.location_id,
    t.status,
    'ORPHANED: teams.provider_id not in authorized_providers' as issue
FROM teams t
LEFT JOIN authorized_providers ap ON t.provider_id = ap.id
WHERE t.provider_id IS NOT NULL 
AND ap.id IS NULL;

-- 5.2 ORPHANED PROVIDER_TEAM_ASSIGNMENTS
SELECT 
    '5.2 ORPHANED PROVIDER_TEAM_ASSIGNMENTS' as analysis_section,
    pta.id as assignment_id,
    pta.provider_id,
    pta.team_id,
    pta.status,
    CASE 
        WHEN ap.id IS NULL THEN 'ORPHANED: provider_id not in authorized_providers'
        WHEN t.id IS NULL THEN 'ORPHANED: team_id not in teams'
        ELSE 'VALID'
    END as issue
FROM provider_team_assignments pta
LEFT JOIN authorized_providers ap ON pta.provider_id = ap.id
LEFT JOIN teams t ON pta.team_id = t.id
WHERE ap.id IS NULL OR t.id IS NULL;

-- 5.3 TEAMS.PROVIDER_ID vs PROVIDER_TEAM_ASSIGNMENTS MISMATCH
SELECT 
    '5.3 TEAMS.PROVIDER_ID vs ASSIGNMENTS MISMATCH' as analysis_section,
    t.id as team_id,
    t.name as team_name,
    t.provider_id as teams_provider_id,
    pta.provider_id as assignment_provider_id,
    pta.assignment_role,
    pta.status as assignment_status,
    'MISMATCH: teams.provider_id != assignment.provider_id' as issue
FROM teams t
LEFT JOIN provider_team_assignments pta ON t.id = pta.team_id AND pta.status = 'active'
WHERE t.provider_id IS NOT NULL 
AND pta.provider_id IS NOT NULL
AND t.provider_id != pta.provider_id;

-- 5.4 PROVIDER PRIMARY LOCATIONS vs TEAM LOCATIONS MISMATCH
SELECT 
    '5.4 PROVIDER PRIMARY vs TEAM LOCATION MISMATCH' as analysis_section,
    ap.id as provider_id,
    ap.name as provider_name,
    ap.primary_location_id,
    t.id as team_id,
    t.name as team_name,
    t.location_id as team_location_id,
    pta.assignment_role,
    'LOCATION MISMATCH: provider.primary_location_id != team.location_id' as issue
FROM authorized_providers ap
JOIN provider_team_assignments pta ON ap.id = pta.provider_id
JOIN teams t ON pta.team_id = t.id
WHERE pta.status = 'active'
AND ap.primary_location_id IS NOT NULL
AND t.location_id IS NOT NULL
AND ap.primary_location_id != t.location_id;

-- 5.5 AP USERS WITHOUT AUTHORIZED_PROVIDER RECORDS
SELECT 
    '5.5 AP USERS WITHOUT AUTHORIZED_PROVIDER RECORDS' as analysis_section,
    p.id as profile_id,
    p.display_name,
    p.email,
    p.role,
    p.status,
    'MISSING: AP user without authorized_provider record' as issue
FROM profiles p
LEFT JOIN authorized_providers ap ON p.id = ap.user_id
WHERE p.role = 'AP'
AND p.status = 'ACTIVE'
AND ap.id IS NULL;

-- 5.6 AUTHORIZED_PROVIDERS WITHOUT VALID USER PROFILES
SELECT 
    '5.6 AUTHORIZED_PROVIDERS WITHOUT VALID USER PROFILES' as analysis_section,
    ap.id as provider_id,
    ap.name as provider_name,
    ap.user_id,
    ap.status as provider_status,
    'MISSING: authorized_provider without valid profile' as issue
FROM authorized_providers ap
LEFT JOIN profiles p ON ap.user_id = p.id
WHERE ap.user_id IS NOT NULL
AND (p.id IS NULL OR p.role != 'AP' OR p.status != 'ACTIVE');

-- =====================================================================================
-- 6. CRITICAL SYNCHRONIZATION ANALYSIS FOR BARRIE FIRST AID
-- =====================================================================================

-- 6.1 SPECIFIC AP USER: Barrie First Aid and CPR Training
SELECT 
    '6.1 BARRIE FIRST AID AP USER ANALYSIS' as analysis_section,
    p.id as profile_id,
    p.display_name,
    p.email,
    p.role,
    p.status as profile_status,
    ap.id as provider_id,
    ap.name as provider_name,
    ap.status as provider_status,
    ap.primary_location_id,
    l.name as primary_location_name
FROM profiles p
LEFT JOIN authorized_providers ap ON p.id = ap.user_id
LEFT JOIN locations l ON ap.primary_location_id = l.id
WHERE p.display_name ILIKE '%barrie%first%aid%'
   OR p.email ILIKE '%barrie%'
   OR ap.name ILIKE '%barrie%first%aid%';

-- 6.2 BARRIE FIRST AID TEAM ASSIGNMENTS
SELECT 
    '6.2 BARRIE FIRST AID TEAM ASSIGNMENTS' as analysis_section,
    ap.id as provider_id,
    ap.name as provider_name,
    t.id as team_id,
    t.name as team_name,
    t.location_id as team_location_id,
    pta.assignment_role,
    pta.status as assignment_status,
    pta.created_at,
    pta.updated_at
FROM authorized_providers ap
JOIN provider_team_assignments pta ON ap.id = pta.provider_id
JOIN teams t ON pta.team_id = t.id
WHERE ap.name ILIKE '%barrie%first%aid%'
ORDER BY pta.updated_at DESC;

-- 6.3 BARRIE FIRST AID LOCATION CONSISTENCY CHECK
SELECT 
    '6.3 BARRIE FIRST AID LOCATION CONSISTENCY' as analysis_section,
    ap.name as provider_name,
    ap.primary_location_id,
    pl.name as provider_location_name,
    t.name as team_name,
    t.location_id as team_location_id,
    tl.name as team_location_name,
    CASE 
        WHEN ap.primary_location_id = t.location_id THEN 'CONSISTENT'
        ELSE 'INCONSISTENT'
    END as location_consistency
FROM authorized_providers ap
LEFT JOIN locations pl ON ap.primary_location_id = pl.id
JOIN provider_team_assignments pta ON ap.id = pta.provider_id
JOIN teams t ON pta.team_id = t.id
LEFT JOIN locations tl ON t.location_id = tl.id
WHERE ap.name ILIKE '%barrie%first%aid%'
AND pta.status = 'active';

-- =====================================================================================
-- 7. SUMMARY STATISTICS FOR TROUBLESHOOTING
-- =====================================================================================

-- 7.1 OVERALL RELATIONSHIP HEALTH SUMMARY
SELECT 
    '7.1 RELATIONSHIP HEALTH SUMMARY' as analysis_section,
    metric,
    count
FROM (
    SELECT 'Total AP Users' as metric, COUNT(*) as count
    FROM profiles WHERE role = 'AP'
    
    UNION ALL
    
    SELECT 'Active AP Users', COUNT(*)
    FROM profiles WHERE role = 'AP' AND status = 'ACTIVE'
    
    UNION ALL
    
    SELECT 'Authorized Providers', COUNT(*)
    FROM authorized_providers
    
    UNION ALL
    
    SELECT 'Active Authorized Providers', COUNT(*)
    FROM authorized_providers WHERE status IN ('active', 'APPROVED')
    
    UNION ALL
    
    SELECT 'Teams with Provider Assignment', COUNT(*)
    FROM teams WHERE provider_id IS NOT NULL
    
    UNION ALL
    
    SELECT 'Active Provider-Team Assignments', COUNT(*)
    FROM provider_team_assignments WHERE status = 'active'
    
    UNION ALL
    
    SELECT 'Teams without Provider', COUNT(*)
    FROM teams WHERE provider_id IS NULL
    
    UNION ALL
    
    SELECT 'Orphaned Teams', COUNT(*)
    FROM teams t 
    LEFT JOIN authorized_providers ap ON t.provider_id = ap.id
    WHERE t.provider_id IS NOT NULL AND ap.id IS NULL
    
    UNION ALL
    
    SELECT 'Location Mismatches', COUNT(*)
    FROM authorized_providers ap
    JOIN provider_team_assignments pta ON ap.id = pta.provider_id
    JOIN teams t ON pta.team_id = t.id
    WHERE pta.status = 'active'
    AND ap.primary_location_id IS NOT NULL
    AND t.location_id IS NOT NULL
    AND ap.primary_location_id != t.location_id
) summary
ORDER BY metric;

-- =====================================================================================
-- 8. SUGGESTED FIXES BASED ON FINDINGS
-- =====================================================================================

-- 8.1 IDENTIFY RECORDS NEEDING SYNCHRONIZATION
SELECT 
    '8.1 SYNCHRONIZATION CANDIDATES' as analysis_section,
    'Run this query after analyzing above results to identify specific records needing fixes' as instructions,
    'Look for: orphaned records, mismatched locations, missing assignments' as focus_areas;