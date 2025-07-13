-- Fix variable naming conflict in the database function
CREATE OR REPLACE FUNCTION public.get_admin_team_statistics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
    total_teams_count INTEGER;
    total_members_count INTEGER;
    active_teams_count INTEGER;
    inactive_teams_count INTEGER;
    suspended_teams_count INTEGER;
    avg_performance_score NUMERIC;
    avg_compliance_score NUMERIC;
BEGIN
    -- Get basic team statistics
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN status = 'active' THEN 1 END),
        COUNT(CASE WHEN status = 'inactive' THEN 1 END),
        COUNT(CASE WHEN status = 'suspended' THEN 1 END),
        COALESCE(AVG(performance_score), 85.0),
        COALESCE(AVG(
            CASE 
                WHEN current_metrics->>'compliance_score' IS NOT NULL 
                THEN (current_metrics->>'compliance_score')::numeric
                ELSE 90.0
            END
        ), 90.0)
    INTO total_teams_count, active_teams_count, inactive_teams_count, suspended_teams_count, avg_performance_score, avg_compliance_score
    FROM public.teams;
    
    -- Get total active members
    SELECT COUNT(*)
    INTO total_members_count
    FROM public.team_members
    WHERE status = 'active';
    
    -- Build result object with real data
    result := jsonb_build_object(
        'totalTeams', total_teams_count,
        'totalMembers', total_members_count,
        'activeTeams', active_teams_count,
        'inactiveTeams', inactive_teams_count,
        'suspendedTeams', suspended_teams_count,
        'averagePerformance', ROUND(avg_performance_score, 1),
        'averageCompliance', ROUND(avg_compliance_score, 1),
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
                ROUND(team_avg_performance, 1)
            )
            FROM (
                SELECT 
                    team_type,
                    AVG(performance_score) as team_avg_performance
                FROM public.teams
                WHERE status = 'active' AND performance_score IS NOT NULL
                GROUP BY team_type
            ) pt
        ),
        'instructor_role_distribution', (
            SELECT jsonb_object_agg(
                CASE 
                    WHEN p.role = 'IC' THEN 'Instructor - Certified'
                    WHEN p.role = 'IP' THEN 'Instructor - Provisional'
                    WHEN p.role = 'IT' THEN 'Instructor - In Training'
                    WHEN p.role = 'AP' THEN 'Authorized Provider'
                    WHEN p.role = 'AD' THEN 'Administrator'
                    WHEN p.role = 'SA' THEN 'System Administrator'
                    ELSE p.role
                END,
                role_count
            )
            FROM (
                SELECT 
                    p.role,
                    COUNT(*) as role_count
                FROM public.profiles p
                JOIN public.team_members tm ON p.id = tm.user_id
                WHERE tm.status = 'active'
                GROUP BY p.role
            ) rc
        )
    );
    
    RETURN result;
END;
$$;