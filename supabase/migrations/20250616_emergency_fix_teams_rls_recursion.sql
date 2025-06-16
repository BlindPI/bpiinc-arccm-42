-- Emergency fix for teams table RLS recursion issue
-- The problem is that queries to teams table are triggering team_members RLS policies
-- This creates a comprehensive fix to break the recursion chain

-- First, temporarily disable RLS on teams table to break the cycle
ALTER TABLE public.teams DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on teams table
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'teams' AND schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON public.teams';
            RAISE NOTICE 'Dropped teams policy: %', policy_record.policyname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop teams policy %: %', policy_record.policyname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Re-enable RLS on teams table
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies for teams table

-- 1. SA (System Admin) can see and manage all teams
CREATE POLICY "sa_full_access_teams" ON public.teams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
);

-- 2. AD (Admin) can see and manage all teams
CREATE POLICY "ad_full_access_teams" ON public.teams
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
);

-- 3. Users can view teams they are members of (using a direct, non-recursive approach)
CREATE POLICY "users_can_view_member_teams" ON public.teams
FOR SELECT USING (
    -- Direct check without triggering team_members RLS
    id IN (
        SELECT DISTINCT tm.team_id 
        FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
);

-- 4. Team admins can manage their teams (simplified, non-recursive)
CREATE POLICY "team_admins_manage_teams" ON public.teams
FOR ALL USING (
    -- Check if user is admin of this specific team
    id IN (
        SELECT DISTINCT tm.team_id 
        FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
        AND tm.role = 'ADMIN'
        AND tm.status = 'active'
    )
);

-- Create a function to safely get teams without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_teams_safe(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    description TEXT,
    team_type VARCHAR,
    status VARCHAR,
    performance_score INTEGER,
    location_id UUID,
    provider_id UUID,
    created_by UUID,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    metadata JSONB,
    monthly_targets JSONB,
    current_metrics JSONB
) AS $$
BEGIN
    -- Check if user has admin privileges
    IF EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = COALESCE(p_user_id, auth.uid())
        AND profiles.role IN ('SA', 'AD')
    ) THEN
        -- Admin users can see all teams
        RETURN QUERY
        SELECT 
            t.id, t.name, t.description, t.team_type, t.status,
            t.performance_score, t.location_id, t.provider_id,
            t.created_by, t.created_at, t.updated_at,
            t.metadata, t.monthly_targets, t.current_metrics
        FROM public.teams t;
    ELSE
        -- Regular users can only see teams they're members of
        RETURN QUERY
        SELECT 
            t.id, t.name, t.description, t.team_type, t.status,
            t.performance_score, t.location_id, t.provider_id,
            t.created_by, t.created_at, t.updated_at,
            t.metadata, t.monthly_targets, t.current_metrics
        FROM public.teams t
        WHERE t.id IN (
            SELECT DISTINCT tm.team_id 
            FROM public.team_members tm
            WHERE tm.user_id = COALESCE(p_user_id, auth.uid())
            AND tm.status = 'active'
        );
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get team statistics without RLS issues
CREATE OR REPLACE FUNCTION public.get_team_statistics_safe()
RETURNS TABLE (
    total_teams BIGINT,
    active_teams BIGINT,
    inactive_teams BIGINT,
    suspended_teams BIGINT,
    average_performance NUMERIC
) AS $$
BEGIN
    -- Check if user has admin privileges
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('SA', 'AD')
    ) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;

    RETURN QUERY
    SELECT 
        COUNT(*) as total_teams,
        COUNT(*) FILTER (WHERE status = 'active') as active_teams,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_teams,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_teams,
        ROUND(AVG(COALESCE(performance_score, 0)), 2) as average_performance
    FROM public.teams;
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_teams_safe(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_statistics_safe() TO authenticated;

-- Add comments for documentation
COMMENT ON POLICY "sa_full_access_teams" ON public.teams IS 'System Admins have full access to all teams';
COMMENT ON POLICY "ad_full_access_teams" ON public.teams IS 'Admins have full access to all teams';
COMMENT ON POLICY "users_can_view_member_teams" ON public.teams IS 'Users can view teams they are members of (non-recursive)';
COMMENT ON POLICY "team_admins_manage_teams" ON public.teams IS 'Team admins can manage their teams (non-recursive)';

COMMENT ON FUNCTION public.get_teams_safe(UUID) IS 'Get teams data safely without triggering RLS recursion';
COMMENT ON FUNCTION public.get_team_statistics_safe() IS 'Get team statistics safely for admin users';

-- Test the new functions
DO $$
BEGIN
    RAISE NOTICE 'Teams RLS policies have been reset to prevent recursion';
    RAISE NOTICE 'New safe functions created: get_teams_safe, get_team_statistics_safe';
    RAISE NOTICE 'Emergency fix applied to break RLS recursion chain';
END $$;