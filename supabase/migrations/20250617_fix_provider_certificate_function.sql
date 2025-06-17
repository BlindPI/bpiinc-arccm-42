-- Fix the get_provider_certificates_detailed function to use correct column names

DROP FUNCTION IF EXISTS get_provider_certificates_detailed(UUID);

CREATE OR REPLACE FUNCTION get_provider_certificates_detailed(p_provider_id UUID)
RETURNS TABLE (
    certificate_id UUID,
    verification_code TEXT,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    team_name VARCHAR(255),
    location_name VARCHAR(255),
    course_name TEXT,
    issue_date TEXT,
    expiry_date TEXT,
    status TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cert.id as certificate_id,
        cert.verification_code,
        COALESCE(p.display_name, cert.recipient_name) as user_name,
        COALESCE(p.email, cert.recipient_email) as user_email,
        t.name as team_name,
        l.name as location_name,
        cert.course_name,
        cert.issue_date,
        cert.expiry_date,
        cert.status
    
    FROM public.provider_team_assignments pta
    JOIN public.teams t ON pta.team_id = t.id
    LEFT JOIN public.certificates cert ON t.location_id = cert.location_id
    LEFT JOIN public.profiles p ON cert.user_id = p.id
    LEFT JOIN public.locations l ON t.location_id = l.id
    
    WHERE pta.provider_id = p_provider_id
    AND pta.status = 'active'
    AND cert.id IS NOT NULL
    AND cert.status = 'ACTIVE'
    
    ORDER BY cert.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_provider_certificates_detailed(UUID) TO authenticated;

RAISE NOTICE 'Fixed get_provider_certificates_detailed function with correct column names';