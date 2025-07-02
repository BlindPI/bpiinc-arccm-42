-- Fix get_teams_bypass_rls function return type mismatch
-- Need to drop and recreate the function to change return types

DROP FUNCTION IF EXISTS get_teams_bypass_rls(UUID);

CREATE OR REPLACE FUNCTION get_teams_bypass_rls(p_user_id UUID DEFAULT NULL)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    team_type character varying(50),
    status character varying(20),
    created_at TIMESTAMPTZ,
    member_count BIGINT,
    location_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Use provided user_id or current authenticated user
    current_user_id := COALESCE(p_user_id, auth.uid());
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'No user ID provided and no authenticated user found';
    END IF;
    
    -- Get user role directly (no RLS)
    DECLARE
        user_role TEXT;
    BEGIN
        SELECT p.role INTO user_role 
        FROM public.profiles p 
        WHERE p.id = current_user_id;
        
        -- SA and AD can see all teams
        IF user_role IN ('SA', 'AD') THEN
            RETURN QUERY
            SELECT 
                t.id,
                t.name,
                t.description,
                t.team_type,
                t.status,
                t.created_at,
                COALESCE(COUNT(tm.id), 0) AS member_count,
                COALESCE(l.name, 'No Location') AS location_name
            FROM public.teams t
            LEFT JOIN public.team_members tm ON t.id = tm.team_id AND tm.status = 'active'
            LEFT JOIN public.locations l ON t.location_id = l.id
            WHERE t.status IN ('active', 'ACTIVE', 'Active')
            GROUP BY t.id, t.name, t.description, t.team_type, t.status, t.created_at, l.name
            ORDER BY t.name;
            RETURN;
        END IF;
        
        -- Regular users see teams they're members of
        RETURN QUERY
        SELECT 
            t.id,
            t.name,
            t.description,
            t.team_type,
            t.status,
            t.created_at,
            COALESCE(COUNT(tm_all.id), 0) AS member_count,
            COALESCE(l.name, 'No Location') AS location_name
        FROM public.teams t
        INNER JOIN public.team_members tm_user ON t.id = tm_user.team_id 
        LEFT JOIN public.team_members tm_all ON t.id = tm_all.team_id AND tm_all.status = 'active'
        LEFT JOIN public.locations l ON t.location_id = l.id
        WHERE tm_user.user_id = current_user_id 
        AND tm_user.status = 'active'
        AND t.status IN ('active', 'ACTIVE', 'Active')
        GROUP BY t.id, t.name, t.description, t.team_type, t.status, t.created_at, l.name
        ORDER BY t.name;
        
    EXCEPTION WHEN OTHERS THEN
        -- If profile access fails, return empty result
        RETURN;
    END;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_teams_bypass_rls(UUID) TO authenticated;