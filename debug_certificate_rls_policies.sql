-- =============================================================================
-- CERTIFICATE RLS POLICY ANALYSIS SQL
-- =============================================================================
-- Purpose: Analyze Row Level Security policies to identify why AP users 
-- cannot access certificate data in dashboard vs certificate management pages

-- PART 1: Detailed RLS Policy Analysis
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS POLICY DETAILED ANALYSIS ===';
END $$;

-- Get all RLS policies for certificates table with details
SELECT 
    'CERTIFICATES RLS POLICIES' as analysis_type,
    policyname as policy_name,
    cmd as command_type,
    CASE
        WHEN permissive = true THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END as policy_type,
    qual as using_clause,
    with_check as with_check_clause,
    CASE 
        WHEN qual ILIKE '%auth.uid()%' THEN 'Uses auth.uid()'
        WHEN qual ILIKE '%profiles%' THEN 'Checks profiles table'
        WHEN qual ILIKE '%certificate_requests%' THEN 'Links to certificate_requests'
        WHEN qual ILIKE '%ap_user_location%' THEN 'Uses AP location assignments'
        WHEN qual = 'true' THEN 'Public access'
        ELSE 'Other logic'
    END as access_pattern
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificates'
ORDER BY cmd, policyname;

-- PART 2: Check for AP-specific certificate access policies
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== AP USER CERTIFICATE ACCESS INVESTIGATION ===';
END $$;

-- Look for AP-specific RLS policies
SELECT 
    'AP_SPECIFIC_POLICIES' as analysis_type,
    policyname,
    cmd,
    qual as policy_logic
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificates'
  AND (qual ILIKE '%AP%' OR qual ILIKE '%ap_user%' OR qual ILIKE '%location%');

-- Check if ap_user_location_assignments policies exist
SELECT 
    'AP_LOCATION_ASSIGNMENT_POLICIES' as analysis_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'ap_user_location_assignments';

-- PART 3: Test AP User Certificate Access Simulation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SIMULATED AP USER ACCESS TEST ===';
END $$;

-- Test what an AP user would see based on location assignments
-- This simulates the RLS policy logic without actual auth context
SELECT 
    'AP_USER_CERTIFICATE_ACCESS_SIMULATION' as test_type,
    COUNT(*) as accessible_certificates,
    COUNT(DISTINCT c.location_id) as accessible_locations,
    string_agg(DISTINCT l.name, ', ') as location_names
FROM certificates c
JOIN locations l ON c.location_id = l.id
WHERE c.location_id IN (
    -- Simulate what locations an AP user would have access to
    SELECT DISTINCT apla.location_id 
    FROM ap_user_location_assignments apla
    WHERE apla.ap_user_id IS NOT NULL
);

-- Get sample of what AP users should be able to see
SELECT 
    'SAMPLE_AP_ACCESSIBLE_CERTIFICATES' as test_type,
    c.id,
    c.recipient_name,
    c.verification_code,
    c.location_id,
    l.name as location_name,
    c.status,
    c.created_at
FROM certificates c
JOIN locations l ON c.location_id = l.id
WHERE c.location_id IN (
    SELECT DISTINCT apla.location_id 
    FROM ap_user_location_assignments apla
    WHERE apla.ap_user_id IS NOT NULL
)
ORDER BY c.created_at DESC
LIMIT 5;

-- PART 4: Policy Conflict Detection
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS POLICY CONFLICT DETECTION ===';
END $$;

-- Count policies by command type to identify potential conflicts
SELECT 
    'POLICY_COUNT_BY_COMMAND' as analysis_type,
    cmd as command_type,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) > 3 THEN 'HIGH - Potential Conflicts'
        WHEN COUNT(*) > 1 THEN 'MEDIUM - Review Needed'
        ELSE 'LOW - Acceptable'
    END as conflict_risk
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificates'
GROUP BY cmd
ORDER BY COUNT(*) DESC;

-- Identify overlapping SELECT policies that might conflict
SELECT 
    'OVERLAPPING_SELECT_POLICIES' as analysis_type,
    policyname,
    CASE 
        WHEN qual ILIKE '%auth.uid()%' AND qual ILIKE '%user_id%' THEN 'User ownership check'
        WHEN qual ILIKE '%profiles%' AND qual ILIKE '%role%' THEN 'Role-based access'
        WHEN qual ILIKE '%certificate_requests%' THEN 'Request-based access'
        WHEN qual = 'true' THEN 'Public access (DANGEROUS)'
        ELSE 'Other logic'
    END as policy_purpose,
    qual as policy_logic
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificates'
  AND cmd = 'SELECT'
ORDER BY policyname;

-- PART 5: Certificate Data Access by User Type Simulation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== USER TYPE ACCESS SIMULATION ===';
END $$;

-- Simulate different user types accessing certificates
-- SA/AD users (should see all)
SELECT 
    'SA_AD_USER_ACCESS' as user_type,
    COUNT(*) as accessible_certificates,
    'Should see ALL certificates' as expected_behavior
FROM certificates;

-- AP users based on location assignments
SELECT 
    'AP_USER_ACCESS' as user_type,
    COUNT(*) as accessible_certificates,
    'Should see certificates from assigned locations only' as expected_behavior
FROM certificates c
WHERE c.location_id IN (
    SELECT DISTINCT location_id 
    FROM ap_user_location_assignments
);

-- Regular users (should see only their own)
SELECT 
    'REGULAR_USER_ACCESS' as user_type,
    COUNT(DISTINCT user_id) as users_with_certificates,
    COUNT(*) as total_user_certificates,
    'Should see only their own certificates' as expected_behavior
FROM certificates
WHERE user_id IS NOT NULL;

-- PART 6: Missing AP Certificate Access Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MISSING AP CERTIFICATE ACCESS POLICIES ===';
END $$;

-- Check if there are specific policies for AP certificate access
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = 'certificates'
              AND qual ILIKE '%ap_user_location%'
        ) THEN 'AP location-based certificate access policy EXISTS'
        ELSE 'AP location-based certificate access policy MISSING'
    END as ap_policy_status;

-- Check for provider_team_assignments based access
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
              AND tablename = 'certificates'
              AND qual ILIKE '%provider_team%'
        ) THEN 'Provider team-based certificate access policy EXISTS'
        ELSE 'Provider team-based certificate access policy MISSING'
    END as provider_policy_status;

-- PART 7: Dashboard vs Certificate Management Access Comparison
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== DASHBOARD VS CERTIFICATE MANAGEMENT ACCESS COMPARISON ===';
END $$;

-- Show what certificates AP users should access in dashboard (currently using certificate_requests)
SELECT 
    'DASHBOARD_CERTIFICATE_REQUESTS_QUERY' as query_type,
    COUNT(*) as record_count,
    'Dashboard queries certificate_requests table (WRONG!)' as issue
FROM certificate_requests;

-- Show what certificates AP users actually access in certificate management (using certificates table)
SELECT 
    'CERTIFICATE_MANAGEMENT_CERTIFICATES_QUERY' as query_type,
    COUNT(*) as record_count,
    'Certificate management queries certificates table (CORRECT!)' as behavior
FROM certificates
WHERE location_id IN (
    SELECT DISTINCT location_id 
    FROM ap_user_location_assignments
);

DO $$
BEGIN
    RAISE NOTICE '=== CERTIFICATE RLS ANALYSIS COMPLETE ===';
    RAISE NOTICE 'Key findings will show:';
    RAISE NOTICE '1. Policy conflicts and overlaps';
    RAISE NOTICE '2. Missing AP-specific certificate access policies';
    RAISE NOTICE '3. Simulated access patterns for different user types';
    RAISE NOTICE '4. Dashboard vs certificate management access mismatches';
END $$;