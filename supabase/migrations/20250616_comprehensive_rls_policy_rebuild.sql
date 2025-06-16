-- Comprehensive RLS Policy Rebuild - Fix Infinite Recursion
-- Date: 2025-06-16
-- Purpose: Systematically drop all problematic RLS policies and rebuild with optimized, non-recursive logic

-- =====================================================
-- STEP 1: DISABLE RLS ON ALL AFFECTED TABLES
-- =====================================================

ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: DROP ALL EXISTING PROBLEMATIC POLICIES
-- =====================================================

-- Function to safely drop policies
CREATE OR REPLACE FUNCTION drop_all_team_policies()
RETURNS void AS $$
DECLARE
    policy_record RECORD;
    table_names TEXT[] := ARRAY['teams', 'team_members', 'profiles', 'locations'];
    table_name TEXT;
BEGIN
    FOREACH table_name IN ARRAY table_names
    LOOP
        FOR policy_record IN 
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = table_name 
            AND schemaname = 'public'
        LOOP
            BEGIN
                EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.' || table_name;
                RAISE NOTICE 'Dropped policy: % on table %', policy_record.policyname, table_name;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the cleanup
SELECT drop_all_team_policies();

-- =====================================================
-- STEP 3: CREATE HELPER FUNCTIONS (NON-RECURSIVE)
-- =====================================================

-- Function to get user role directly from profiles without RLS
CREATE OR REPLACE FUNCTION get_user_role_direct(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query bypassing RLS
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_uuid;
    
    RETURN COALESCE(user_role, 'IN');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is SA or AD without RLS
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN get_user_role_direct(user_uuid) IN ('SA', 'AD');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check team membership directly without RLS
CREATE OR REPLACE FUNCTION is_team_member_direct(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    member_exists BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.team_members 
        WHERE user_id = user_uuid AND team_id = team_uuid
    ) INTO member_exists;
    
    RETURN member_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is team admin directly without RLS
CREATE OR REPLACE FUNCTION is_team_admin_direct(user_uuid UUID, team_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.team_members 
        WHERE user_id = user_uuid 
        AND team_id = team_uuid 
        AND role IN ('admin', 'lead')
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's team IDs directly without RLS
CREATE OR REPLACE FUNCTION get_user_team_ids_direct(user_uuid UUID)
RETURNS UUID[] AS $$
DECLARE
    team_ids UUID[];
BEGIN
    SELECT ARRAY_AGG(team_id) INTO team_ids
    FROM public.team_members
    WHERE user_id = user_uuid;
    
    RETURN COALESCE(team_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 4: CREATE OPTIMIZED, NON-RECURSIVE RLS POLICIES
-- =====================================================

-- Re-enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES TABLE POLICIES (FOUNDATION - NO DEPENDENCIES)
-- =====================================================

-- Users can view their own profile
CREATE POLICY "profiles_self_access" ON public.profiles
FOR SELECT USING (id = auth.uid());

-- SA and AD can view all profiles
CREATE POLICY "profiles_admin_access" ON public.profiles
FOR SELECT USING (
    get_user_role_direct(auth.uid()) IN ('SA', 'AD')
);

-- Users can view profiles of people in their teams (non-recursive)
CREATE POLICY "profiles_team_member_access" ON public.profiles
FOR SELECT USING (
    id = ANY(
        SELECT DISTINCT tm2.user_id
        FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = auth.uid()
    )
);

-- Users can update their own profile
CREATE POLICY "profiles_self_update" ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- Users can insert their own profile (during registration)
CREATE POLICY "profiles_self_insert" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());

-- =====================================================
-- TEAMS TABLE POLICIES (DEPENDS ONLY ON HELPER FUNCTIONS)
-- =====================================================

-- SA and AD can access all teams
CREATE POLICY "teams_admin_full_access" ON public.teams
FOR ALL USING (
    is_admin_user(auth.uid())
);

-- Users can view teams they are members of
CREATE POLICY "teams_member_view" ON public.teams
FOR SELECT USING (
    id = ANY(get_user_team_ids_direct(auth.uid()))
);

-- Team admins can update their teams
CREATE POLICY "teams_admin_update" ON public.teams
FOR UPDATE USING (
    is_team_admin_direct(auth.uid(), id)
);

-- Authenticated users can create teams
CREATE POLICY "teams_create" ON public.teams
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- TEAM_MEMBERS TABLE POLICIES (DEPENDS ONLY ON HELPER FUNCTIONS)
-- =====================================================

-- SA and AD can manage all team members
CREATE POLICY "team_members_admin_full_access" ON public.team_members
FOR ALL USING (
    is_admin_user(auth.uid())
);

-- Users can view their own memberships
CREATE POLICY "team_members_self_view" ON public.team_members
FOR SELECT USING (user_id = auth.uid());

-- Users can view members of teams they belong to
CREATE POLICY "team_members_team_view" ON public.team_members
FOR SELECT USING (
    team_id = ANY(get_user_team_ids_direct(auth.uid()))
);

-- Team admins can manage members in their teams
CREATE POLICY "team_members_admin_manage" ON public.team_members
FOR ALL USING (
    is_team_admin_direct(auth.uid(), team_id)
);

-- Users can leave teams (delete their own membership)
CREATE POLICY "team_members_self_leave" ON public.team_members
FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- LOCATIONS TABLE POLICIES (SIMPLIFIED)
-- =====================================================

-- SA and AD can manage all locations
CREATE POLICY "locations_admin_full_access" ON public.locations
FOR ALL USING (
    is_admin_user(auth.uid())
);

-- All authenticated users can view locations
CREATE POLICY "locations_view_all" ON public.locations
FOR SELECT USING (auth.uid() IS NOT NULL);

-- =====================================================
-- STEP 5: CREATE BYPASS FUNCTIONS FOR EMERGENCY USE
-- =====================================================

-- Function to get teams safely without RLS issues
CREATE OR REPLACE FUNCTION get_teams_bypass_rls(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    team_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    member_count BIGINT,
    location_name TEXT
) AS $$
BEGIN
    -- If user is SA/AD, return all teams
    IF is_admin_user(COALESCE(p_user_id, auth.uid())) THEN
        RETURN QUERY
        SELECT 
            t.id,
            t.name,
            t.description,
            t.team_type,
            t.status,
            t.created_at,
            COUNT(tm.id) as member_count,
            l.name as location_name
        FROM public.teams t
        LEFT JOIN public.team_members tm ON t.id = tm.team_id
        LEFT JOIN public.locations l ON t.location_id = l.id
        GROUP BY t.id, t.name, t.description, t.team_type, t.status, t.created_at, l.name
        ORDER BY t.created_at DESC;
    ELSE
        -- Return only teams the user is a member of
        RETURN QUERY
        SELECT 
            t.id,
            t.name,
            t.description,
            t.team_type,
            t.status,
            t.created_at,
            COUNT(tm2.id) as member_count,
            l.name as location_name
        FROM public.teams t
        JOIN public.team_members tm1 ON t.id = tm1.team_id
        LEFT JOIN public.team_members tm2 ON t.id = tm2.team_id
        LEFT JOIN public.locations l ON t.location_id = l.id
        WHERE tm1.user_id = COALESCE(p_user_id, auth.uid())
        GROUP BY t.id, t.name, t.description, t.team_type, t.status, t.created_at, l.name
        ORDER BY t.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team members safely
CREATE OR REPLACE FUNCTION get_team_members_bypass_rls(p_team_id UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    team_id UUID,
    role TEXT,
    joined_at TIMESTAMPTZ,
    display_name TEXT,
    email TEXT,
    user_role TEXT
) AS $$
BEGIN
    -- Check if user has access to this team
    IF NOT (is_admin_user(auth.uid()) OR is_team_member_direct(auth.uid(), p_team_id)) THEN
        RAISE EXCEPTION 'Access denied to team members';
    END IF;

    RETURN QUERY
    SELECT 
        tm.id,
        tm.user_id,
        tm.team_id,
        tm.role,
        tm.created_at as joined_at,
        p.display_name,
        p.email,
        p.role as user_role
    FROM public.team_members tm
    JOIN public.profiles p ON tm.user_id = p.id
    WHERE tm.team_id = p_team_id
    ORDER BY tm.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create team safely
CREATE OR REPLACE FUNCTION create_team_bypass_rls(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_location_id UUID DEFAULT NULL,
    p_team_type TEXT DEFAULT 'standard',
    p_status TEXT DEFAULT 'active'
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    team_type TEXT,
    status TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    new_team_id UUID;
BEGIN
    -- Insert the team
    INSERT INTO public.teams (name, description, location_id, team_type, status, created_by)
    VALUES (p_name, p_description, p_location_id, p_team_type, p_status, auth.uid())
    RETURNING teams.id INTO new_team_id;

    -- Add creator as team admin
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (new_team_id, auth.uid(), 'admin');

    -- Return the created team
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.description,
        t.team_type,
        t.status,
        t.created_at
    FROM public.teams t
    WHERE t.id = new_team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get team analytics safely
CREATE OR REPLACE FUNCTION get_team_analytics_bypass_rls()
RETURNS TABLE(
    total_teams BIGINT,
    total_members BIGINT,
    active_teams BIGINT,
    inactive_teams BIGINT
) AS $$
BEGIN
    -- Only allow SA/AD to access analytics
    IF NOT is_admin_user(auth.uid()) THEN
        RAISE EXCEPTION 'Access denied to team analytics';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(DISTINCT t.id) as total_teams,
        COUNT(DISTINCT tm.id) as total_members,
        COUNT(DISTINCT CASE WHEN t.status = 'active' THEN t.id END) as active_teams,
        COUNT(DISTINCT CASE WHEN t.status != 'active' THEN t.id END) as inactive_teams
    FROM public.teams t
    LEFT JOIN public.team_members tm ON t.id = tm.team_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: CLEANUP AND DOCUMENTATION
-- =====================================================

-- Drop the temporary cleanup function
DROP FUNCTION drop_all_team_policies();

-- Add comprehensive comments
COMMENT ON FUNCTION get_user_role_direct(UUID) IS 'Get user role directly from profiles without RLS - prevents recursion';
COMMENT ON FUNCTION is_admin_user(UUID) IS 'Check if user is SA or AD without RLS - prevents recursion';
COMMENT ON FUNCTION is_team_member_direct(UUID, UUID) IS 'Check team membership directly without RLS - prevents recursion';
COMMENT ON FUNCTION is_team_admin_direct(UUID, UUID) IS 'Check team admin status directly without RLS - prevents recursion';
COMMENT ON FUNCTION get_user_team_ids_direct(UUID) IS 'Get user team IDs directly without RLS - prevents recursion';

COMMENT ON FUNCTION get_teams_bypass_rls(UUID) IS 'Get teams data safely without triggering RLS recursion';
COMMENT ON FUNCTION get_team_members_bypass_rls(UUID) IS 'Get team members safely without triggering RLS recursion';
COMMENT ON FUNCTION create_team_bypass_rls(TEXT, TEXT, UUID, TEXT, TEXT) IS 'Create team safely without triggering RLS recursion';
COMMENT ON FUNCTION get_team_analytics_bypass_rls() IS 'Get team analytics safely without triggering RLS recursion';

-- Policy documentation
COMMENT ON POLICY "profiles_self_access" ON public.profiles IS 'Users can view their own profile - foundation policy';
COMMENT ON POLICY "profiles_admin_access" ON public.profiles IS 'SA/AD can view all profiles - uses direct role check';
COMMENT ON POLICY "profiles_team_member_access" ON public.profiles IS 'Users can view team member profiles - non-recursive';

COMMENT ON POLICY "teams_admin_full_access" ON public.teams IS 'SA/AD have full team access - uses helper function';
COMMENT ON POLICY "teams_member_view" ON public.teams IS 'Users can view their teams - uses helper function';
COMMENT ON POLICY "teams_admin_update" ON public.teams IS 'Team admins can update teams - uses helper function';

COMMENT ON POLICY "team_members_admin_full_access" ON public.team_members IS 'SA/AD have full member access - uses helper function';
COMMENT ON POLICY "team_members_self_view" ON public.team_members IS 'Users can view own memberships - direct check';
COMMENT ON POLICY "team_members_team_view" ON public.team_members IS 'Users can view team members - uses helper function';

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== COMPREHENSIVE RLS POLICY REBUILD COMPLETE ===';
    RAISE NOTICE 'All problematic RLS policies have been dropped and rebuilt';
    RAISE NOTICE 'New policies use helper functions to prevent recursion';
    RAISE NOTICE 'Bypass functions created for emergency use';
    RAISE NOTICE 'System should now be free of infinite recursion issues';
    RAISE NOTICE '=== REBUILD COMPLETE ===';
END $$;