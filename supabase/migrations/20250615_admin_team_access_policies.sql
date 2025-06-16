-- Migration: Administrative Team Access Policies
-- Description: Add RLS policies to allow SA/AD users global team access without team membership requirements
-- Date: 2025-06-15

-- Drop existing restrictive policies that block SA/AD global access
DROP POLICY IF EXISTS "teams_member_access" ON public.teams;
DROP POLICY IF EXISTS "teams_admin_manage" ON public.teams;

-- Create enhanced team access policies
CREATE POLICY "enhanced_teams_access" ON public.teams
FOR SELECT USING (
    -- SA users can see all teams (global oversight)
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
    OR
    -- AD users can see all teams (administrative oversight)
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
    OR
    -- Team members can see their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
    )
);

-- Create enhanced team management policies
CREATE POLICY "enhanced_teams_management" ON public.teams
FOR ALL USING (
    -- SA users can manage all teams
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
    OR
    -- AD users can manage all teams
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
    OR
    -- Team admins can manage their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.role = 'ADMIN'
    )
);

-- Create team creation policy for administrators
CREATE POLICY "admin_teams_creation" ON public.teams
FOR INSERT WITH CHECK (
    -- SA users can create teams
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
    OR
    -- AD users can create teams
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
    OR
    -- Other users can create teams (existing functionality)
    true
);

-- Enhanced team members access for administrators
DROP POLICY IF EXISTS "team_members_access" ON public.team_members;

CREATE POLICY "enhanced_team_members_access" ON public.team_members
FOR SELECT USING (
    -- SA users can see all team members
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
    OR
    -- AD users can see all team members
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
    OR
    -- Team members can see members of their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
    )
    OR
    -- Users can see their own membership records
    team_members.user_id = auth.uid()
);

-- Enhanced team members management for administrators
CREATE POLICY "enhanced_team_members_management" ON public.team_members
FOR ALL USING (
    -- SA users can manage all team members
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SA'
    )
    OR
    -- AD users can manage all team members
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'AD'
    )
    OR
    -- Team admins can manage members of their teams
    EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'ADMIN'
    )
    OR
    -- Users can manage their own membership (for leaving teams)
    team_members.user_id = auth.uid()
);

-- Create function to check if user has administrative team access
CREATE OR REPLACE FUNCTION public.has_admin_team_access(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    -- SA and AD users have administrative access
    RETURN user_role IN ('SA', 'AD');
END;
$$;

-- Create function to get all teams for administrative oversight
CREATE OR REPLACE FUNCTION public.get_admin_teams_overview()
RETURNS TABLE (
    team_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user has admin access
    IF NOT public.has_admin_team_access(auth.uid()) THEN
        RAISE EXCEPTION 'Insufficient permissions for administrative team access';
    END IF;
    
    -- Return enhanced team data with member counts and location info
    RETURN QUERY
    SELECT jsonb_build_object(
        'id', t.id,
        'name', t.name,
        'description', t.description,
        'team_type', t.team_type,
        'status', t.status,
        'performance_score', t.performance_score,
        'location_id', t.location_id,
        'provider_id', t.provider_id,
        'created_by', t.created_by,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'metadata', COALESCE(t.metadata, '{}'::jsonb),
        'monthly_targets', COALESCE(t.monthly_targets, '{}'::jsonb),
        'current_metrics', COALESCE(t.current_metrics, '{}'::jsonb),
        'member_count', COALESCE(member_counts.count, 0),
        'location', CASE 
            WHEN l.id IS NOT NULL THEN jsonb_build_object(
                'id', l.id,
                'name', l.name,
                'address', l.address,
                'city', l.city,
                'state', l.state
            )
            ELSE NULL
        END,
        'provider', CASE 
            WHEN p.id IS NOT NULL THEN jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'provider_type', p.provider_type,
                'status', p.status
            )
            ELSE NULL
        END
    ) as team_data
    FROM public.teams t
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN public.providers p ON t.provider_id = p.id
    LEFT JOIN (
        SELECT team_id, COUNT(*) as count
        FROM public.team_members
        WHERE status = 'active'
        GROUP BY team_id
    ) member_counts ON t.id = member_counts.team_id
    ORDER BY t.created_at DESC;
END;
$$;

-- Create function to get administrative team statistics
CREATE OR REPLACE FUNCTION public.get_admin_team_statistics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user has admin access
    IF NOT public.has_admin_team_access(auth.uid()) THEN
        RAISE EXCEPTION 'Insufficient permissions for administrative team statistics';
    END IF;
    
    -- Calculate comprehensive team statistics
    SELECT jsonb_build_object(
        'total_teams', (SELECT COUNT(*) FROM public.teams),
        'total_members', (SELECT COUNT(*) FROM public.team_members WHERE status = 'active'),
        'performance_average', (
            SELECT COALESCE(AVG(performance_score), 0)
            FROM public.teams
            WHERE status = 'active'
        ),
        'compliance_score', (
            SELECT COALESCE(AVG(
                CASE 
                    WHEN current_metrics->>'compliance_score' IS NOT NULL 
                    THEN (current_metrics->>'compliance_score')::numeric
                    ELSE 0
                END
            ), 0)
            FROM public.teams
            WHERE status = 'active'
        ),
        'active_teams', (SELECT COUNT(*) FROM public.teams WHERE status = 'active'),
        'inactive_teams', (SELECT COUNT(*) FROM public.teams WHERE status = 'inactive'),
        'suspended_teams', (SELECT COUNT(*) FROM public.teams WHERE status = 'suspended'),
        'teams_by_location', (
            SELECT jsonb_object_agg(
                COALESCE(l.name, 'No Location'),
                team_count
            )
            FROM (
                SELECT 
                    t.location_id,
                    COUNT(*) as team_count
                FROM public.teams t
                GROUP BY t.location_id
            ) tc
            LEFT JOIN public.locations l ON tc.location_id = l.id
        ),
        'performance_by_team_type', (
            SELECT jsonb_object_agg(
                team_type,
                avg_performance
            )
            FROM (
                SELECT 
                    team_type,
                    AVG(performance_score) as avg_performance
                FROM public.teams
                WHERE status = 'active'
                GROUP BY team_type
            ) pt
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_admin_team_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_teams_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_team_statistics() TO authenticated;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_status ON public.teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_team_type ON public.teams(team_type);
CREATE INDEX IF NOT EXISTS idx_teams_performance_score ON public.teams(performance_score);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON public.team_members(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Add comments for documentation
COMMENT ON POLICY "enhanced_teams_access" ON public.teams IS 'Allows SA/AD global team access and team members to access their teams';
COMMENT ON POLICY "enhanced_teams_management" ON public.teams IS 'Allows SA/AD to manage all teams and team admins to manage their teams';
COMMENT ON POLICY "admin_teams_creation" ON public.teams IS 'Allows SA/AD and other users to create teams';
COMMENT ON POLICY "enhanced_team_members_access" ON public.team_members IS 'Allows SA/AD global member access and team members to see their team members';
COMMENT ON POLICY "enhanced_team_members_management" ON public.team_members IS 'Allows SA/AD to manage all members and team admins to manage their team members';

COMMENT ON FUNCTION public.has_admin_team_access(UUID) IS 'Checks if user has administrative team access (SA/AD roles)';
COMMENT ON FUNCTION public.get_admin_teams_overview() IS 'Returns comprehensive team data for administrative oversight';
COMMENT ON FUNCTION public.get_admin_team_statistics() IS 'Returns team statistics and analytics for administrators';

-- Log the migration
DO $$
BEGIN
    RAISE NOTICE 'Administrative team access policies migration completed successfully';
    RAISE NOTICE 'SA/AD users now have global team oversight capabilities';
    RAISE NOTICE 'Enhanced RLS policies provide proper administrative access control';
END $$;