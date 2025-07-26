-- =============================================================================
-- CERTIFICATE MANAGEMENT INVESTIGATION SQL
-- =============================================================================
-- Purpose: Investigate certificate table schemas, data distribution, and RLS policies
-- to identify why certificate data is not displaying properly in the dashboard

-- PART 1: Table Schema Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== CERTIFICATE TABLE SCHEMA INVESTIGATION ===';
END $$;

-- Check if certificate_requests table exists and get its structure
SELECT 
    'certificate_requests' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'certificate_requests'
ORDER BY ordinal_position;

-- Check if certificates table exists and get its structure  
SELECT 
    'certificates' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'certificates'
ORDER BY ordinal_position;

-- PART 2: Data Count Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== DATA COUNT INVESTIGATION ===';
END $$;

-- Count records in certificate_requests table
SELECT 
    'certificate_requests' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
    COUNT(DISTINCT location_id) as unique_locations,
    COUNT(DISTINCT user_id) as unique_users
FROM certificate_requests;

-- Count records in certificates table (if it exists)
SELECT 
    'certificates' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_count,
    COUNT(*) FILTER (WHERE status = 'INACTIVE') as inactive_count,
    COUNT(DISTINCT location_id) as unique_locations,
    COUNT(DISTINCT user_id) as unique_users
FROM certificates
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'certificates'
);

-- PART 3: Location-based Data Distribution
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== LOCATION-BASED DATA DISTRIBUTION ===';
END $$;

-- Show certificate_requests by location
SELECT 
    l.id as location_id,
    l.name as location_name,
    l.status as location_status,
    COUNT(cr.id) as certificate_requests_count,
    COUNT(cr.id) FILTER (WHERE cr.status = 'approved') as approved_requests
FROM locations l
LEFT JOIN certificate_requests cr ON l.id = cr.location_id
GROUP BY l.id, l.name, l.status
ORDER BY certificate_requests_count DESC;

-- Show certificates by location (if table exists)
SELECT 
    l.id as location_id,
    l.name as location_name,
    l.status as location_status,
    COUNT(c.id) as certificates_count,
    COUNT(c.id) FILTER (WHERE c.status = 'ACTIVE') as active_certificates
FROM locations l
LEFT JOIN certificates c ON l.id = c.location_id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'certificates'
)
GROUP BY l.id, l.name, l.status
ORDER BY certificates_count DESC;

-- PART 4: RLS Policy Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RLS POLICY INVESTIGATION ===';
END $$;

-- Check RLS status for certificate tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    hasrls as has_rls_policies
FROM pg_tables 
WHERE schemaname = 'public' 
  AND (tablename = 'certificates' OR tablename = 'certificate_requests');

-- Get RLS policies for certificate_requests
SELECT 
    'certificate_requests' as table_name,
    policyname as policy_name,
    cmd as command_type,
    permissive,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificate_requests';

-- Get RLS policies for certificates
SELECT 
    'certificates' as table_name,
    policyname as policy_name,
    cmd as command_type,
    permissive,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'certificates';

-- PART 5: Team and Provider Assignment Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== TEAM AND PROVIDER ASSIGNMENT INVESTIGATION ===';
END $$;

-- Check how many AP users have provider assignments
SELECT 
    'ap_user_provider_assignments' as context,
    COUNT(DISTINCT ap.user_id) as ap_users_with_assignments,
    COUNT(DISTINCT apla.location_id) as assigned_locations,
    COUNT(*) as total_assignments
FROM authorized_providers ap
LEFT JOIN ap_user_location_assignments apla ON ap.user_id = apla.ap_user_id
WHERE ap.status = 'active';

-- Check team assignments for providers
SELECT 
    'provider_team_assignments' as context,
    COUNT(DISTINCT pta.provider_id) as providers_with_teams,
    COUNT(DISTINCT pta.team_id) as teams_assigned,
    COUNT(*) as total_assignments
FROM provider_team_assignments pta
WHERE pta.status = 'active';

-- PART 6: Sample Data Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== SAMPLE DATA INVESTIGATION ===';
END $$;

-- Show sample certificate_requests with location details
SELECT 
    cr.id,
    cr.recipient_name,
    cr.course_name,
    cr.status,
    cr.location_id,
    l.name as location_name,
    cr.user_id,
    p.display_name as requested_by,
    cr.created_at
FROM certificate_requests cr
LEFT JOIN locations l ON cr.location_id = l.id
LEFT JOIN profiles p ON cr.user_id = p.id
ORDER BY cr.created_at DESC
LIMIT 10;

-- Show sample certificates with location details (if table exists)
SELECT 
    c.id,
    c.verification_code,
    c.status,
    c.location_id,
    l.name as location_name,
    c.user_id,
    p.display_name as certificate_holder,
    c.created_at
FROM certificates c
LEFT JOIN locations l ON c.location_id = l.id
LEFT JOIN profiles p ON c.user_id = p.id
WHERE EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'certificates'
)
ORDER BY c.created_at DESC
LIMIT 10;

-- PART 7: Relationship Investigation
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== RELATIONSHIP INVESTIGATION ===';
END $$;

-- Check foreign key relationships for certificate tables
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu 
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (tc.table_name = 'certificates' OR tc.table_name = 'certificate_requests');

DO $$
BEGIN
    RAISE NOTICE '=== CERTIFICATE INVESTIGATION COMPLETE ===';
    RAISE NOTICE 'Review the results above to identify:';
    RAISE NOTICE '1. Which table contains the actual certificate data';
    RAISE NOTICE '2. Data distribution across locations';
    RAISE NOTICE '3. RLS policies that might be blocking access';
    RAISE NOTICE '4. Relationship between certificate_requests and certificates';
    RAISE NOTICE '5. Provider/team assignment patterns';
END $$;