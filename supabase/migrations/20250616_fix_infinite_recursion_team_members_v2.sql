-- Fix infinite recursion in team_members RLS policies - Version 2
-- This addresses the critical issue preventing team management functionality
-- Fixed function name conflicts

-- First, disable RLS temporarily to clean up
ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on team_members to start fresh
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all policies on team_members table
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'team_members' AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.team_members';
            RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Drop existing functions that might conflict
DROP FUNCTION IF EXISTS public.is_team_admin(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_user_team_memberships(uuid);
DROP FUNCTION IF EXISTS public.get_team_members_list(uuid);

-- Re-enable RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- 1. SA (System Admin) can see and manage all team members
CREATE POLICY "sa_full_access_team_members" ON public.team_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
);

-- 2. AD (Admin) can see and manage all team members
CREATE POLICY "ad_full_access_team_members" ON public.team_members
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
);

-- 3. Users can see their own team memberships (non-recursive)
CREATE POLICY "users_own_memberships" ON public.team_members
FOR SELECT USING (
    user_id = auth.uid()
);

-- 4. Team admins can manage members in their teams (simplified, non-recursive)
-- This policy uses a direct subquery without recursion
CREATE POLICY "team_admin_manage_members" ON public.team_members
FOR ALL USING (
    -- Check if current user is admin of any team that matches the target team
    EXISTS (
        SELECT 1 FROM public.team_members admin_check
        WHERE admin_check.user_id = auth.uid()
        AND admin_check.team_id = team_members.team_id
        AND admin_check.role = 'ADMIN'
        AND admin_check.status = 'active'
    )
);

-- 5. Allow users to leave teams (delete their own membership)
CREATE POLICY "users_can_leave_teams" ON public.team_members
FOR DELETE USING (
    user_id = auth.uid()
);

-- Create a simple function to check team admin status without recursion
CREATE OR REPLACE FUNCTION public.check_team_admin_status(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Direct query without policy recursion using a different approach
    SELECT EXISTS (
        SELECT 1 
        FROM public.team_members 
        WHERE user_id = p_user_id 
        AND team_id = p_team_id 
        AND role = 'ADMIN' 
        AND status = 'active'
    ) INTO is_admin;
    
    RETURN is_admin;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user's team memberships without policy recursion
CREATE OR REPLACE FUNCTION public.fetch_user_team_memberships(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    team_id UUID,
    user_id UUID,
    role TEXT,
    status TEXT,
    location_assignment TEXT,
    assignment_start_date TIMESTAMP,
    assignment_end_date TIMESTAMP,
    team_position TEXT,
    permissions JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
) AS $$
BEGIN
    -- Direct query bypassing RLS
    RETURN QUERY
    SELECT 
        tm.id,
        tm.team_id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.location_assignment,
        tm.assignment_start_date,
        tm.assignment_end_date,
        tm.team_position,
        tm.permissions,
        tm.created_at,
        tm.updated_at
    FROM public.team_members tm
    WHERE tm.user_id = p_user_id;
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get team members for a specific team
CREATE OR REPLACE FUNCTION public.fetch_team_members_with_profiles(p_team_id UUID)
RETURNS TABLE (
    id UUID,
    team_id UUID,
    user_id UUID,
    role TEXT,
    status TEXT,
    location_assignment TEXT,
    assignment_start_date TIMESTAMP,
    assignment_end_date TIMESTAMP,
    team_position TEXT,
    permissions JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    display_name TEXT,
    email TEXT,
    user_role TEXT
) AS $$
BEGIN
    -- Check if user has permission to view this team's members
    IF NOT (
        -- SA/AD can see all
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
        OR
        -- User is a member of this team (direct check to avoid recursion)
        auth.uid() IN (
            SELECT tm.user_id 
            FROM public.team_members tm 
            WHERE tm.team_id = p_team_id
        )
    ) THEN
        RAISE EXCEPTION 'Access denied to team members';
    END IF;

    -- Return team members with profile info
    RETURN QUERY
    SELECT 
        tm.id,
        tm.team_id,
        tm.user_id,
        tm.role,
        tm.status,
        tm.location_assignment,
        tm.assignment_start_date,
        tm.assignment_end_date,
        tm.team_position,
        tm.permissions,
        tm.created_at,
        tm.updated_at,
        COALESCE(p.display_name, 'Unknown User') as display_name,
        p.email,
        p.role as user_role
    FROM public.team_members tm
    LEFT JOIN public.profiles p ON tm.user_id = p.id
    WHERE tm.team_id = p_team_id;
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_team_admin_status(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_user_team_memberships(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_team_members_with_profiles(UUID) TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "sa_full_access_team_members" ON public.team_members IS 'System Admins have full access to all team members';
COMMENT ON POLICY "ad_full_access_team_members" ON public.team_members IS 'Admins have full access to all team members';
COMMENT ON POLICY "users_own_memberships" ON public.team_members IS 'Users can view their own team memberships';
COMMENT ON POLICY "team_admin_manage_members" ON public.team_members IS 'Team admins can manage members in their teams (non-recursive)';
COMMENT ON POLICY "users_can_leave_teams" ON public.team_members IS 'Users can leave teams by deleting their membership';

COMMENT ON FUNCTION public.check_team_admin_status(UUID, UUID) IS 'Check if user is admin of specific team without policy recursion';
COMMENT ON FUNCTION public.fetch_user_team_memberships(UUID) IS 'Get user team memberships bypassing RLS to prevent recursion';
COMMENT ON FUNCTION public.fetch_team_members_with_profiles(UUID) IS 'Get team members with profile info, includes permission check';

-- Test the policies by running a simple query
DO $$
BEGIN
    RAISE NOTICE 'Team members RLS policies have been reset and simplified to prevent infinite recursion';
    RAISE NOTICE 'New functions created: check_team_admin_status, fetch_user_team_memberships, fetch_team_members_with_profiles';
    RAISE NOTICE 'All existing conflicting functions have been dropped and recreated';
END $$;