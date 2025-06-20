-- NUCLEAR CLEANUP: Teams and AP Role Provider Assignments
-- Locations remain intact - they work
-- Complete rebuild of Teams and AP User Role relationships

-- =============================================================================
-- STEP 1: NUCLEAR DATA CLEANUP (Keep Locations)
-- =============================================================================

-- Clear all broken teams and related data
DELETE FROM public.team_members;
DELETE FROM public.provider_team_assignments;
DELETE FROM public.ap_user_location_assignments;
DELETE FROM public.teams;
DELETE FROM public.authorized_providers;

-- Clear ALL broken team-related functions that might be causing conflicts
-- Drop all function overloads by searching for function names
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Drop all versions of assign_ap_user_to_location
    FOR func_record IN
        SELECT oid::regprocedure as func_name
        FROM pg_proc
        WHERE proname = 'assign_ap_user_to_location'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_name;
    END LOOP;
    
    -- Drop all versions of get_ap_user_assignments
    FOR func_record IN
        SELECT oid::regprocedure as func_name
        FROM pg_proc
        WHERE proname = 'get_ap_user_assignments'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_name;
    END LOOP;
    
    -- Drop all versions of get_available_ap_users_for_location
    FOR func_record IN
        SELECT oid::regprocedure as func_name
        FROM pg_proc
        WHERE proname = 'get_available_ap_users_for_location'
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_name;
    END LOOP;
    
    -- Drop sync functions
    FOR func_record IN
        SELECT oid::regprocedure as func_name
        FROM pg_proc
        WHERE proname IN ('sync_ap_user_location_assignment', 'fix_existing_ap_user_assignments')
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS ' || func_record.func_name || ' CASCADE';
        RAISE NOTICE 'Dropped function: %', func_record.func_name;
    END LOOP;
END;
$$;

-- Drop broken tables
DROP TABLE IF EXISTS public.ap_user_location_assignments CASCADE;
DROP TABLE IF EXISTS public.provider_team_assignments CASCADE;
DROP TABLE IF EXISTS public.authorized_providers CASCADE;

-- =============================================================================
-- STEP 2: REBUILD CORE TABLES FROM SCRATCH
-- =============================================================================

-- Clean Teams Table (keep it simple)
DROP TABLE IF EXISTS public.teams CASCADE;
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    assigned_ap_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    team_type VARCHAR(50) DEFAULT 'general',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clean Team Members Table
DROP TABLE IF EXISTS public.team_members CASCADE;
CREATE TABLE public.team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Clean AP User Location Assignments (SIMPLE)
CREATE TABLE public.ap_user_location_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ap_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.profiles(id),
    UNIQUE(ap_user_id, location_id)
);

-- =============================================================================
-- STEP 3: ENABLE RLS (Simple Policies)
-- =============================================================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ap_user_location_assignments ENABLE ROW LEVEL SECURITY;

-- Simple RLS: Admin access to everything
CREATE POLICY "admin_full_teams_access" ON public.teams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "admin_full_team_members_access" ON public.team_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

CREATE POLICY "admin_full_ap_assignments_access" ON public.ap_user_location_assignments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('SA', 'AD')
    )
);

-- AP users can view their own assignments and teams
CREATE POLICY "ap_users_view_own_assignments" ON public.ap_user_location_assignments
FOR SELECT USING (ap_user_id = auth.uid());

CREATE POLICY "ap_users_view_their_teams" ON public.teams
FOR SELECT USING (assigned_ap_user_id = auth.uid());

CREATE POLICY "ap_users_manage_their_team_members" ON public.team_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.teams 
        WHERE teams.id = team_members.team_id 
        AND teams.assigned_ap_user_id = auth.uid()
    )
);

-- =============================================================================
-- STEP 4: CORE FUNCTIONS (Simple and Clean)
-- =============================================================================

-- Function 1: Assign AP User to Location
CREATE OR REPLACE FUNCTION assign_ap_user_to_location(
    p_ap_user_id UUID,
    p_location_id UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    assignment_id UUID;
BEGIN
    -- Verify user is AP and location exists
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_ap_user_id AND role = 'AP' AND status = 'ACTIVE') THEN
        RAISE EXCEPTION 'User is not an active AP user';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.locations WHERE id = p_location_id) THEN
        RAISE EXCEPTION 'Location does not exist';
    END IF;
    
    -- Create or reactivate assignment
    INSERT INTO public.ap_user_location_assignments (
        ap_user_id,
        location_id,
        assigned_by
    ) VALUES (
        p_ap_user_id,
        p_location_id,
        auth.uid()
    )
    ON CONFLICT (ap_user_id, location_id) 
    DO UPDATE SET
        status = 'active',
        assigned_at = NOW(),
        assigned_by = auth.uid()
    RETURNING id INTO assignment_id;
    
    RETURN assignment_id;
END;
$$;

-- Function 2: Create Team with AP User Assignment
CREATE OR REPLACE FUNCTION create_team_with_ap_user(
    p_name VARCHAR(255),
    p_description TEXT,
    p_location_id UUID,
    p_ap_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    team_id UUID;
BEGIN
    -- Verify AP user is assigned to this location
    IF NOT EXISTS (
        SELECT 1 FROM public.ap_user_location_assignments 
        WHERE ap_user_id = p_ap_user_id 
        AND location_id = p_location_id 
        AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'AP user is not assigned to this location';
    END IF;
    
    -- Create team
    INSERT INTO public.teams (
        name,
        description,
        location_id,
        assigned_ap_user_id,
        created_by
    ) VALUES (
        p_name,
        p_description,
        p_location_id,
        p_ap_user_id,
        auth.uid()
    )
    RETURNING id INTO team_id;
    
    RETURN team_id;
END;
$$;

-- Function 3: Get AP User Dashboard Data
CREATE OR REPLACE FUNCTION get_ap_user_dashboard(p_ap_user_id UUID)
RETURNS TABLE (
    location_id UUID,
    location_name VARCHAR(255),
    team_count BIGINT,
    member_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id as location_id,
        l.name as location_name,
        COUNT(DISTINCT t.id) as team_count,
        COUNT(DISTINCT tm.id) as member_count
    FROM public.ap_user_location_assignments ala
    JOIN public.locations l ON ala.location_id = l.id
    LEFT JOIN public.teams t ON t.location_id = l.id AND t.assigned_ap_user_id = p_ap_user_id AND t.status = 'active'
    LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.status = 'active'
    WHERE ala.ap_user_id = p_ap_user_id
    AND ala.status = 'active'
    GROUP BY l.id, l.name
    ORDER BY l.name;
END;
$$;

-- =============================================================================
-- STEP 5: INDEXES
-- =============================================================================

CREATE INDEX idx_teams_location_id ON public.teams(location_id);
CREATE INDEX idx_teams_assigned_ap_user_id ON public.teams(assigned_ap_user_id);
CREATE INDEX idx_teams_status ON public.teams(status);
CREATE INDEX idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX idx_ap_assignments_ap_user_id ON public.ap_user_location_assignments(ap_user_id);
CREATE INDEX idx_ap_assignments_location_id ON public.ap_user_location_assignments(location_id);

-- =============================================================================
-- STEP 6: PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ap_user_location_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location TO authenticated;
GRANT EXECUTE ON FUNCTION create_team_with_ap_user TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_dashboard TO authenticated;

-- =============================================================================
-- COMPLETION
-- =============================================================================

RAISE NOTICE '💥 NUCLEAR CLEANUP COMPLETE!';
RAISE NOTICE '🧹 Cleared: All broken teams, AP assignments, and provider data';
RAISE NOTICE '🏗️  Rebuilt: Clean teams and AP user location assignment tables';
RAISE NOTICE '🔧 Created: Simple, reliable functions for core operations';
RAISE NOTICE '✅ Ready: For clean slate implementation';
RAISE NOTICE '📍 Preserved: All location data (working correctly)';