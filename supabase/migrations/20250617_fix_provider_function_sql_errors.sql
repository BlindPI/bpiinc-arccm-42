-- Fix SQL errors in provider location functions

DROP FUNCTION IF EXISTS get_provider_location_kpis(UUID);
DROP FUNCTION IF EXISTS get_provider_location_teams(UUID);

-- =============================================================================
-- Function: get_provider_location_kpis (FIXED)
-- Purpose: Get KPIs for a provider including certificate counts
-- =============================================================================

CREATE OR REPLACE FUNCTION get_provider_location_kpis(p_provider_id UUID)
RETURNS TABLE (
    total_instructors BIGINT,
    active_instructors BIGINT,
    total_courses BIGINT,
    certificates_issued BIGINT,
    compliance_score NUMERIC,
    performance_rating NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        -- Count instructors from teams assigned to this provider
        COALESCE(instructor_counts.total_instructors, 0) as total_instructors,
        COALESCE(instructor_counts.active_instructors, 0) as active_instructors,
        
        -- Count courses from teams assigned to this provider (FIXED: removed c.location_id reference)
        COALESCE(course_counts.total_courses, 0) as total_courses,
        
        -- Count certificates using location-based logic
        COALESCE(cert_counts.certificates_issued, 0) as certificates_issued,
        
        -- Get provider compliance and performance scores
        COALESCE(ap.compliance_score, 0) as compliance_score,
        COALESCE(ap.performance_rating, 0) as performance_rating
    
    FROM public.authorized_providers ap
    
    -- Get instructor counts from assigned teams
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            COUNT(DISTINCT tm.user_id) as total_instructors,
            COUNT(DISTINCT CASE WHEN tm.status = 'active' THEN tm.user_id END) as active_instructors
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        LEFT JOIN public.team_members tm ON t.id = tm.team_id
        LEFT JOIN public.profiles p ON tm.user_id = p.id
        WHERE pta.status = 'active' 
        AND (p.role = 'IN' OR p.role = 'AP')  -- Instructors and APs
        GROUP BY pta.provider_id
    ) instructor_counts ON ap.id = instructor_counts.provider_id
    
    -- Get course counts from assigned teams (FIXED: simplified query)
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            COUNT(DISTINCT co.id) as total_courses
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        LEFT JOIN public.course_offerings co ON t.location_id = co.location_id
        WHERE pta.status = 'active'
        GROUP BY pta.provider_id
    ) course_counts ON ap.id = course_counts.provider_id
    
    -- Get certificate counts using location-based logic
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            COUNT(DISTINCT cert.id) as certificates_issued
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        LEFT JOIN public.certificates cert ON t.location_id = cert.location_id
        WHERE pta.status = 'active'
        AND cert.status = 'ACTIVE'
        GROUP BY pta.provider_id
    ) cert_counts ON ap.id = cert_counts.provider_id
    
    WHERE ap.id = p_provider_id;
END;
$$;

-- =============================================================================
-- Function: get_provider_location_teams (FIXED)
-- Purpose: Get teams assigned to a provider with member counts
-- =============================================================================

CREATE OR REPLACE FUNCTION get_provider_location_teams(p_provider_id UUID)
RETURNS TABLE (
    team_id UUID,
    team_name VARCHAR(255),
    team_description TEXT,
    location_name VARCHAR(255),
    member_count BIGINT,
    performance_score INTEGER
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
        COALESCE(t.performance_score::INTEGER, 0) as performance_score
    
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN (
        SELECT 
            tm.team_id,  -- FIXED: fully qualified column name
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

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_provider_location_kpis(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_location_teams(UUID) TO authenticated;

RAISE NOTICE 'Fixed provider location functions - SQL errors resolved!';
RAISE NOTICE 'Error 1: Removed invalid c.location_id reference, using course_offerings table';
RAISE NOTICE 'Error 2: Fixed ambiguous team_id reference with full qualification';