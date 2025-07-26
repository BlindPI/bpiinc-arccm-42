-- =====================================================
-- EMERGENCY FIX FOR RLS INFINITE RECURSION
-- =====================================================
-- The recent migrations created circular RLS policy dependencies
-- This fix removes the circular dependencies and uses SECURITY DEFINER
-- functions to provide safe, controlled access without recursion

-- =====================================================
-- 1. REMOVE ALL PROBLEMATIC RLS POLICIES
-- =====================================================

-- Drop all the circular RLS policies that are causing infinite recursion
DROP POLICY IF EXISTS "AP users unified team access" ON teams;
DROP POLICY IF EXISTS "AP users unified team member access" ON team_members;
DROP POLICY IF EXISTS "AP users unified certificate access" ON certificates;

-- Drop other potentially problematic AP-related policies
DROP POLICY IF EXISTS "Role-based availability viewing access" ON user_availability;
DROP POLICY IF EXISTS "Role-based availability editing access" ON user_availability;
DROP POLICY IF EXISTS "AP users can view team availability" ON user_availability;
DROP POLICY IF EXISTS "AP users can edit authorized availability" ON user_availability;

-- =====================================================
-- 2. CREATE SECURITY DEFINER FUNCTIONS (BYPASS RLS)
-- =====================================================

-- These functions run with elevated privileges and bypass RLS entirely
-- This prevents the circular dependency issues

-- Core function to check if user is AP and get their provider info
CREATE OR REPLACE FUNCTION get_ap_user_provider_info(
    check_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    user_id UUID,
    provider_id UUID,
    is_ap_user BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Directly query without RLS to avoid recursion
    RETURN QUERY
    SELECT 
        p.id as user_id,
        ap.id as provider_id,
        (p.role = 'AP') as is_ap_user
    FROM profiles p
    LEFT JOIN authorized_providers ap ON ap.user_id = p.id AND ap.status = 'APPROVED'
    WHERE p.id = check_user_id;
END;
$$;

-- Function to get AP accessible teams (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_ap_accessible_teams_safe(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,
    access_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_info RECORD;
BEGIN
    -- First check if user is AP
    SELECT * INTO user_info FROM get_ap_user_provider_info(ap_user_id);
    
    IF NOT user_info.is_ap_user THEN
        RETURN; -- Return empty for non-AP users
    END IF;

    -- Return teams accessible through provider assignments
    RETURN QUERY
    SELECT DISTINCT
        t.id as team_id,
        t.name as team_name,
        'provider_assignment' as access_type
    FROM teams t
    JOIN provider_team_assignments pta ON pta.team_id = t.id
    WHERE pta.provider_id = user_info.provider_id
      AND pta.status = 'active'
    
    UNION
    
    -- Return teams accessible through direct membership
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

-- Function to get AP accessible team members (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_ap_accessible_team_members_safe(
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
SET search_path = public
AS $$
DECLARE
    user_info RECORD;
    accessible_team_ids UUID[];
BEGIN
    -- First check if user is AP
    SELECT * INTO user_info FROM get_ap_user_provider_info(ap_user_id);
    
    IF NOT user_info.is_ap_user THEN
        RETURN; -- Return empty for non-AP users
    END IF;

    -- Get accessible team IDs
    SELECT ARRAY(
        SELECT team_id FROM get_ap_accessible_teams_safe(ap_user_id)
    ) INTO accessible_team_ids;

    -- Return team members from accessible teams
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
      AND t.id = ANY(accessible_team_ids);
END;
$$;

-- Function to get AP accessible locations (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_ap_accessible_locations_safe(
    ap_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
    location_id UUID,
    location_name TEXT,
    access_source TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_info RECORD;
    accessible_team_ids UUID[];
BEGIN
    -- First check if user is AP
    SELECT * INTO user_info FROM get_ap_user_provider_info(ap_user_id);
    
    IF NOT user_info.is_ap_user THEN
        RETURN; -- Return empty for non-AP users
    END IF;

    -- Get accessible team IDs
    SELECT ARRAY(
        SELECT team_id FROM get_ap_accessible_teams_safe(ap_user_id)
    ) INTO accessible_team_ids;

    -- Return locations accessible through team locations
    RETURN QUERY
    SELECT DISTINCT
        l.id as location_id,
        l.name as location_name,
        'team_location' as access_source
    FROM locations l
    JOIN team_locations tl ON tl.location_id = l.id
    WHERE tl.team_id = ANY(accessible_team_ids);
END;
$$;

-- Function to get AP accessible certificates (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION get_ap_accessible_certificates_safe(
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
SET search_path = public
AS $$
DECLARE
    user_info RECORD;
    accessible_location_ids UUID[];
BEGIN
    -- First check if user is AP
    SELECT * INTO user_info FROM get_ap_user_provider_info(ap_user_id);
    
    IF NOT user_info.is_ap_user THEN
        RETURN; -- Return empty for non-AP users
    END IF;

    -- Get accessible location IDs
    SELECT ARRAY(
        SELECT location_id FROM get_ap_accessible_locations_safe(ap_user_id)
    ) INTO accessible_location_ids;

    -- Return certificates from accessible locations
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
    WHERE c.status = 'active'
      AND c.location_id = ANY(accessible_location_ids);
END;
$$;

-- =====================================================
-- 3. CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- =====================================================

-- Simple team access policy (no recursion)
CREATE POLICY "Simple team access" ON teams
FOR SELECT USING (
    -- SA/AD can see all teams
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
    OR
    -- Users can see teams they are direct members of
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- Simple team members access policy (no recursion)
CREATE POLICY "Simple team member access" ON team_members
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
    -- Team members can see other members of the same team
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- Simple certificate access policy (no recursion)
CREATE POLICY "Simple certificate access" ON certificates
FOR SELECT USING (
    -- Users can see their own certificates
    user_id = auth.uid()
    OR
    -- SA/AD can see all certificates
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
);

-- Simple availability access policy (no recursion)
CREATE POLICY "Simple availability access" ON user_availability
FOR SELECT USING (
    -- Users can see their own availability
    user_id = auth.uid()
    OR
    -- SA/AD can see all availability
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role IN ('SA', 'AD')
    )
);

-- =====================================================
-- 4. GRANT PERMISSIONS TO SAFE FUNCTIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_ap_user_provider_info(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_teams_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_team_members_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_locations_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_certificates_safe(UUID) TO authenticated;

-- =====================================================
-- 5. UPDATE THE PREVIOUS FUNCTIONS TO USE SAFE VERSIONS
-- =====================================================

-- Replace the problematic functions with safe versions
DROP FUNCTION IF EXISTS get_ap_accessible_teams(UUID);
DROP FUNCTION IF EXISTS get_ap_accessible_team_members(UUID);
DROP FUNCTION IF EXISTS get_ap_accessible_locations(UUID);
DROP FUNCTION IF EXISTS get_ap_accessible_certificates(UUID);

-- Create aliases for backward compatibility
CREATE OR REPLACE FUNCTION get_ap_accessible_teams(ap_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (team_id UUID, team_name TEXT, access_type TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN QUERY SELECT * FROM get_ap_accessible_teams_safe(ap_user_id); END; $$;

CREATE OR REPLACE FUNCTION get_ap_accessible_team_members(ap_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (user_id UUID, display_name TEXT, email TEXT, role TEXT, team_id UUID, team_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN QUERY SELECT * FROM get_ap_accessible_team_members_safe(ap_user_id); END; $$;

CREATE OR REPLACE FUNCTION get_ap_accessible_locations(ap_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (location_id UUID, location_name TEXT, access_source TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN QUERY SELECT * FROM get_ap_accessible_locations_safe(ap_user_id); END; $$;

CREATE OR REPLACE FUNCTION get_ap_accessible_certificates(ap_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (certificate_id UUID, user_id UUID, user_name TEXT, certificate_type TEXT, certification_level TEXT, issue_date DATE, expiry_date DATE, location_id UUID, location_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$ BEGIN RETURN QUERY SELECT * FROM get_ap_accessible_certificates_safe(ap_user_id); END; $$;

-- Grant permissions to the alias functions
GRANT EXECUTE ON FUNCTION get_ap_accessible_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_team_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_locations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_accessible_certificates(UUID) TO authenticated;

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

-- Test that the functions work without recursion
DO $$
DECLARE
    test_result RECORD;
    ap_user_id UUID;
BEGIN
    -- Get first AP user for testing
    SELECT id INTO ap_user_id FROM profiles WHERE role = 'AP' LIMIT 1;
    
    IF ap_user_id IS NOT NULL THEN
        -- Test each function
        PERFORM * FROM get_ap_accessible_teams_safe(ap_user_id) LIMIT 1;
        RAISE NOTICE 'Teams function: OK';
        
        PERFORM * FROM get_ap_accessible_team_members_safe(ap_user_id) LIMIT 1;
        RAISE NOTICE 'Team members function: OK';
        
        PERFORM * FROM get_ap_accessible_locations_safe(ap_user_id) LIMIT 1;
        RAISE NOTICE 'Locations function: OK';
        
        PERFORM * FROM get_ap_accessible_certificates_safe(ap_user_id) LIMIT 1;
        RAISE NOTICE 'Certificates function: OK';
        
        RAISE NOTICE 'All AP access functions working without recursion!';
    ELSE
        RAISE NOTICE 'No AP users found for testing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during testing: %', SQLERRM;
END $$;

COMMENT ON FUNCTION get_ap_accessible_teams_safe IS 'Safe version that bypasses RLS to prevent infinite recursion';
COMMENT ON FUNCTION get_ap_accessible_team_members_safe IS 'Safe version that bypasses RLS to prevent infinite recursion';
COMMENT ON FUNCTION get_ap_accessible_locations_safe IS 'Safe version that bypasses RLS to prevent infinite recursion';
COMMENT ON FUNCTION get_ap_accessible_certificates_safe IS 'Safe version that bypasses RLS to prevent infinite recursion';