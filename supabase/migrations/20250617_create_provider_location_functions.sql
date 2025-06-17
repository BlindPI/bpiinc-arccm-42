-- Create missing provider location functions for certificate visibility
-- This fixes the Provider Management interface not showing certificates

-- =============================================================================
-- Function: get_provider_location_kpis
-- Purpose: Get KPIs for a provider including certificate counts using team-based logic
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
        
        -- Count courses from teams assigned to this provider
        COALESCE(course_counts.total_courses, 0) as total_courses,
        
        -- Count certificates using TEAM-BASED logic (same as team dashboard)
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
    
    -- Get course counts from assigned teams
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            COUNT(DISTINCT c.id) as total_courses
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        LEFT JOIN public.courses c ON t.location_id = c.location_id
        WHERE pta.status = 'active'
        GROUP BY pta.provider_id
    ) course_counts ON ap.id = course_counts.provider_id
    
    -- Get certificate counts using TEAM-BASED logic (mirrors team dashboard)
    LEFT JOIN (
        SELECT 
            pta.provider_id,
            COUNT(DISTINCT cert.id) as certificates_issued
        FROM public.provider_team_assignments pta
        JOIN public.teams t ON pta.team_id = t.id
        LEFT JOIN public.certificates cert ON t.id = cert.team_id  -- KEY: Use team_id, not location_id
        WHERE pta.status = 'active'
        AND cert.status = 'issued'
        GROUP BY pta.provider_id
    ) cert_counts ON ap.id = cert_counts.provider_id
    
    WHERE ap.id = p_provider_id;
END;
$$;

-- =============================================================================
-- Function: get_provider_location_teams
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
        COALESCE(t.performance_score, 0) as performance_score
    
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    LEFT JOIN (
        SELECT 
            team_id,
            COUNT(*) as member_count
        FROM public.team_members
        WHERE status = 'active'
        GROUP BY team_id
    ) member_counts ON t.id = member_counts.team_id
    
    WHERE pta.provider_id = p_provider_id
    AND pta.status = 'active'
    AND t.status = 'active'
    
    ORDER BY t.name;
END;
$$;

-- =============================================================================
-- Function: get_provider_certificates_detailed
-- Purpose: Get detailed certificate list for a provider (for debugging)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_provider_certificates_detailed(p_provider_id UUID)
RETURNS TABLE (
    certificate_id UUID,
    certificate_number VARCHAR(255),
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    team_name VARCHAR(255),
    location_name VARCHAR(255),
    course_name VARCHAR(255),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(50)
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cert.id as certificate_id,
        cert.certificate_number,
        p.display_name as user_name,
        p.email as user_email,
        t.name as team_name,
        l.name as location_name,
        cert.course_name,
        cert.issue_date,
        cert.expiry_date,
        cert.status
    
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.certificates cert ON t.id = cert.team_id  -- Team-based lookup
    LEFT JOIN public.profiles p ON cert.user_id = p.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    
    WHERE pta.provider_id = p_provider_id
    AND pta.status = 'active'
    AND cert.id IS NOT NULL
    
    ORDER BY cert.issue_date DESC;
END;
$$;

-- =============================================================================
-- Grant permissions
-- =============================================================================

GRANT EXECUTE ON FUNCTION get_provider_location_kpis(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_location_teams(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_certificates_detailed(UUID) TO authenticated;

-- =============================================================================
-- Create indexes for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_certificates_team_id_status ON public.certificates(team_id, status);
CREATE INDEX IF NOT EXISTS idx_provider_team_assignments_provider_status ON public.provider_team_assignments(provider_id, status);

RAISE NOTICE 'Provider location functions created successfully!';
RAISE NOTICE 'Key fix: Certificate queries now use team_id instead of location_id';
RAISE NOTICE 'This should resolve Kevin Geem certificate visibility issue';