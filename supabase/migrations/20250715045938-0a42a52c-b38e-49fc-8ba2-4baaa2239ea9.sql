-- Fix fetch_user_team_memberships function to include team and location data
DROP FUNCTION IF EXISTS public.fetch_user_team_memberships(UUID);

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
    updated_at TIMESTAMP,
    -- Team data
    team_name TEXT,
    team_description TEXT,
    team_type TEXT,
    team_status TEXT,
    -- Location data  
    location_id UUID,
    location_name TEXT,
    location_address TEXT,
    location_city TEXT,
    location_state TEXT
) AS $$
BEGIN
    -- Return team memberships with full team and location data
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
        -- Team data
        t.name as team_name,
        t.description as team_description,
        t.team_type,
        t.status as team_status,
        -- Location data
        l.id as location_id,
        l.name as location_name,
        l.address as location_address,
        l.city as location_city,
        l.state as location_state
    FROM public.team_members tm
    LEFT JOIN public.teams t ON tm.team_id = t.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    WHERE tm.user_id = p_user_id;
EXCEPTION WHEN OTHERS THEN
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;