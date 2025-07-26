-- =====================================================
-- COMPREHENSIVE FIX FOR AP USER SYSTEM-WIDE DATA ACCESS
-- =====================================================
-- This addresses the system-wide AP user data access failure caused by recent migrations
-- that changed access patterns without updating all dependent services.

-- =====================================================
-- 1. ENSURE ALL AP USERS HAVE PROPER TEAM ASSIGNMENTS
-- =====================================================

-- Populate missing provider_team_assignments for AP users who are team members
INSERT INTO provider_team_assignments (
    provider_id,
    team_id,
    status,
    created_at,
    updated_at
)
SELECT DISTINCT
    ap.id as provider_id,
    tm.team_id,
    'active' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM authorized_providers ap
JOIN profiles p ON p.id = ap.user_id
JOIN team_members tm ON tm.user_id = p.id
WHERE p.role = 'AP'
  AND tm.status = 'active'
  AND ap.status = 'APPROVED'
  AND NOT EXISTS (
      SELECT 1 FROM provider_team_assignments pta 
      WHERE pta.provider_id = ap.id 
      AND pta.team_id = tm.team_id
  );

-- =====================================================
-- 2. CREATE UNIFIED AP USER DATA ACCESS FUNCTIONS
-- =====================================================

-- Function to get teams accessible to an AP user (for dashboard services)
CREATE OR REPLACE FUNCTION get_ap_accessible_teams(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    access_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        t.id as team_id,
        t.name as team_name,
        'provider_assignment' as access_type
    FROM teams t
    JOIN provider_team_assignments pta ON pta.team_id = t.id
    JOIN authorized_providers ap ON ap.id = pta.provider_id
    WHERE ap.user_id = ap_user_id
      AND ap.status = 'APPROVED'
      AND pta.status = 'active'
    
    UNION
    
    SELECT DISTINCT
        t.id as team_id,
        t.name as team_name,
        'direct_membership' as access_type
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ap_user_id
      AND tm.status = 'active';
END;
$$;

-- Function to get team members accessible to an AP user (for dashboard services)
CREATE OR REPLACE FUNCTION get_ap_accessible_team_members(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    email TEXT,
    role TEXT,
    team_id UUID,
    team_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id as user_id,
        p.display_name,
        p.email,
        p.role,
        t.id as team_id,
        t.name as team_name
    FROM profiles p
    JOIN team_members tm ON tm.user_id = p.id
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.status = 'active'
      AND tm.team_id IN (
          SELECT team_id FROM get_ap_accessible_teams(ap_user_id)
      );
END;
$$;

-- Function to get locations accessible to an AP user (for certificate data)
CREATE OR REPLACE FUNCTION get_ap_accessible_locations(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    access_source TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        l.id as location_id,
        l.name as location_name,
        'team_location' as access_source
    FROM locations l
    JOIN team_locations tl ON tl.location_id = l.id
    WHERE tl.team_id IN (
        SELECT team_id FROM get_ap_accessible_teams(ap_user_id)
    )
    
    UNION
    
    -- Also include locations directly assigned to the AP user's teams
    SELECT DISTINCT
        l.id as location_id,
        l.name as location_name,
        'direct_assignment' as access_source
    FROM locations l
    JOIN team_members tm ON tm.location_id = l.id
    WHERE tm.user_id = ap_user_id
      AND tm.status = 'active';
END;
$$;

-- Function to get certificates accessible to an AP user by location
CREATE OR REPLACE FUNCTION get_ap_accessible_certificates(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    certificate_id UUID,
    user_id UUID,
    user_name TEXT,
    certificate_type TEXT,
    certification_level TEXT,
    issue_date DATE,
    expiry_date DATE,
    location_id UUID,
    location_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id as certificate_id,
        c.user_id,
        p.display_name as user_name,
        c.certificate_type,
        c.certification_level,
        c.issue_date,
        c.expiry_date,
        l.id as location_id,
        l.name as location_name
    FROM certificates c
    JOIN profiles p ON p.id = c.user_id
    JOIN locations l ON l.id = c.location_id
    WHERE c.location_id IN (
        SELECT location_id FROM get_ap_accessible_locations(ap_user_id)
    )
    AND c.status = 'active';
END;
$$;

-- =====================================================
-- 3. CREATE RLS POLICIES THAT USE THE NEW FUNCTIONS
-- =====================================================

-- Drop existing broken policies
DROP POLICY IF EXISTS "AP users can view team data" ON teams;
DROP POLICY IF EXISTS "AP users can view team members" ON team_members;
DROP POLICY IF EXISTS "AP users can view certificates by location" ON certificates;

-- Create comprehensive team access policy for AP users
CREATE POLICY "AP users unified team access" ON teams
FOR SELECT USING (
    -- SA/AD can see all teams
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- AP users can see teams they have access to
    (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'AP'
        )
        AND id IN (
            SELECT team_id FROM get_ap_accessible_teams(auth.uid())
        )
    )
    OR
    -- Other users can see teams they're members of
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- Create comprehensive team members access policy for AP users
CREATE POLICY "AP users unified team member access" ON team_members
FOR SELECT USING (
    -- Users can see their own membership
    user_id = auth.uid()
    OR
    -- SA/AD can see all memberships
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- AP users can see members of teams they have access to
    (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'AP'
        )
        AND team_id IN (
            SELECT team_id FROM get_ap_accessible_teams(auth.uid())
        )
    )
    OR
    -- Team members can see other members of the same team
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- Create comprehensive certificate access policy for AP users
CREATE POLICY "AP users unified certificate access" ON certificates
FOR SELECT USING (
    -- Users can see their own certificates
    user_id = auth.uid()
    OR
    -- SA/AD can see all certificates
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- AP users can see certificates for their accessible locations
    (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.role = 'AP'
        )
        AND location_id IN (
            SELECT location_id FROM get_ap_accessible_locations(auth.uid())
        )
    )
);

-- =====================================================
-- 4. GRANT PERMISSIONS TO NEW FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_ap_accessible_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_team_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_locations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_certificates(UUID) TO authenticated;

-- =====================================================
-- 5. CREATE VALIDATION VIEWS FOR TESTING
-- =====================================================

-- View to test AP user team access
CREATE OR REPLACE VIEW test_ap_team_access AS
SELECT 
    p.display_name as ap_user,
    (SELECT COUNT(*) FROM get_ap_accessible_teams(p.id)) as accessible_teams_count,
    (SELECT COUNT(*) FROM get_ap_accessible_team_members(p.id)) as accessible_members_count,
    (SELECT COUNT(*) FROM get_ap_accessible_locations(p.id)) as accessible_locations_count,
    (SELECT COUNT(*) FROM get_ap_accessible_certificates(p.id)) as accessible_certificates_count
FROM profiles p
WHERE p.role = 'AP'
ORDER BY p.display_name;

-- =====================================================
-- 6. PREVENTION MEASURES
-- =====================================================

-- Function to validate AP user setup (to prevent future issues)
CREATE OR REPLACE FUNCTION validate_ap_user_setup(
    check_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    has_provider_record BOOLEAN,
    has_team_assignments BOOLEAN,
    has_team_memberships BOOLEAN,
    setup_complete BOOLEAN,
    issues TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.display_name,
        (ap.id IS NOT NULL) as has_provider_record,
        (pta_count.count > 0) as has_team_assignments,
        (tm_count.count > 0) as has_team_memberships,
        (
            ap.id IS NOT NULL 
            AND pta_count.count > 0 
            AND tm_count.count > 0
        ) as setup_complete,
        CASE 
            WHEN ap.id IS NULL THEN 'Missing authorized_providers record'
            WHEN pta_count.count = 0 THEN 'Missing provider_team_assignments'
            WHEN tm_count.count = 0 THEN 'Missing team_members records'
            ELSE 'Setup complete'
        END as issues
    FROM profiles p
    LEFT JOIN authorized_providers ap ON ap.user_id = p.id AND ap.status = 'APPROVED'
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count 
        FROM provider_team_assignments pta 
        WHERE pta.provider_id = ap.id AND pta.status = 'active'
    ) pta_count ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count 
        FROM team_members tm 
        WHERE tm.user_id = p.id AND tm.status = 'active'
    ) tm_count ON true
    WHERE p.role = 'AP'
    AND (check_user_id IS NULL OR p.id = check_user_id)
    ORDER BY p.display_name;
END;
$$;

GRANT EXECUTE ON FUNCTION validate_ap_user_setup(UUID) TO authenticated;

-- =====================================================
-- 7. IMMEDIATE FIXES FOR EXISTING ISSUES
-- =====================================================

-- Fix The Test User by assigning them to a team
-- (This will need to be done manually based on business requirements)

-- Verify all existing AP users have proper setup
DO $$
DECLARE
    validation_record RECORD;
    total_ap_users INTEGER;
    properly_setup INTEGER := 0;
BEGIN
    SELECT COUNT(*) INTO total_ap_users FROM profiles WHERE role = 'AP';
    
    FOR validation_record IN 
        SELECT * FROM validate_ap_user_setup()
    LOOP
        IF validation_record.setup_complete THEN
            properly_setup := properly_setup + 1;
        ELSE
            RAISE NOTICE 'AP User % has issues: %', 
                validation_record.display_name, 
                validation_record.issues;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'AP User Setup Validation:';
    RAISE NOTICE '- Total AP users: %', total_ap_users;
    RAISE NOTICE '- Properly setup: %', properly_setup;
    RAISE NOTICE '- Need attention: %', (total_ap_users - properly_setup);
END $$;

COMMENT ON FUNCTION get_ap_accessible_teams IS 'Returns all teams an AP user can access through provider assignments or direct membership';
COMMENT ON FUNCTION get_ap_accessible_team_members IS 'Returns all team members an AP user can view';
COMMENT ON FUNCTION get_ap_accessible_locations IS 'Returns all locations an AP user can access for certificate data';
COMMENT ON FUNCTION get_ap_accessible_certificates IS 'Returns all certificates an AP user can view by location';
COMMENT ON FUNCTION validate_ap_user_setup IS 'Validates that AP users have all required records for proper system access';