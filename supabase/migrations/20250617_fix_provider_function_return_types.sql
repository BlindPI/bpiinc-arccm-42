-- Fix return types to match actual database schema

DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);

CREATE OR REPLACE FUNCTION get_provider_location_teams(p_provider_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name TEXT,  -- Changed from VARCHAR(255) to TEXT
    team_description TEXT,
    location_name TEXT,  -- Changed from VARCHAR(255) to TEXT  
    member_count BIGINT,
    performance_score NUMERIC  -- Changed from INTEGER to NUMERIC to match teams.performance_score
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as team_id,
        t.name as team_name,
        t.description as team_description,
        l.name as location_name,
        COALESCE(member_counts.member_count, 0) as member_count,
        COALESCE(t.performance_score, 0) as performance_score
    
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN (
        SELECT 
            tm.team_id,
            COUNT(*) as member_count
        FROM public.team_members tm
        WHERE tm.status = 'active'
        GROUP BY tm.team_id
    ) member_counts ON t.id = member_counts.team_id
    
    WHERE pta.provider_id = p_provider_id
    AND pta.status = 'active'
    AND t.status = 'active'
    
    ORDER BY t.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_provider_location_teams(UUID) TO authenticated;

RAISE NOTICE 'Fixed get_provider_location_teams function return types to match database schema';