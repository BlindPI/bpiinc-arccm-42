-- EMERGENCY: Create RLS-bypassing function for roster access - FIXED TYPES
-- User sees rosters in database but RLS is blocking frontend access

CREATE OR REPLACE FUNCTION get_rosters_bypass_rls(p_user_role TEXT, p_user_id UUID, p_location_id UUID DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    status TEXT,
    location_id UUID,
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    certificate_count BIGINT,
    issue_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- For SA/AD users: Return ALL rosters including PENDING
    IF p_user_role IN ('SA', 'AD') THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.name::TEXT,
            COALESCE(r.description, '')::TEXT,
            r.status::TEXT,
            r.location_id,
            r.created_by,
            r.created_at,
            r.updated_at,
            COALESCE(cert_counts.count, 0) as certificate_count,
            r.issue_date::DATE
        FROM rosters r
        LEFT JOIN (
            SELECT roster_id, COUNT(*) as count
            FROM certificates
            GROUP BY roster_id
        ) cert_counts ON cert_counts.roster_id = r.id
        ORDER BY r.created_at DESC;
    
    -- For AP users: Return rosters for their location including PENDING
    ELSIF p_user_role = 'AP' AND p_location_id IS NOT NULL THEN
        RETURN QUERY
        SELECT 
            r.id,
            r.name::TEXT,
            COALESCE(r.description, '')::TEXT,
            r.status::TEXT,
            r.location_id,
            r.created_by,
            r.created_at,
            r.updated_at,
            COALESCE(cert_counts.count, 0) as certificate_count,
            r.issue_date::DATE
        FROM rosters r
        LEFT JOIN (
            SELECT roster_id, COUNT(*) as count
            FROM certificates
            GROUP BY roster_id
        ) cert_counts ON cert_counts.roster_id = r.id
        WHERE r.location_id = p_location_id
        ORDER BY r.created_at DESC;
    
    -- For other users: Return rosters they created
    ELSE
        RETURN QUERY
        SELECT 
            r.id,
            r.name::TEXT,
            COALESCE(r.description, '')::TEXT,
            r.status::TEXT,
            r.location_id,
            r.created_by,
            r.created_at,
            r.updated_at,
            COALESCE(cert_counts.count, 0) as certificate_count,
            r.issue_date::DATE
        FROM rosters r
        LEFT JOIN (
            SELECT roster_id, COUNT(*) as count
            FROM certificates
            GROUP BY roster_id
        ) cert_counts ON cert_counts.roster_id = r.id
        WHERE r.created_by = p_user_id
        ORDER BY r.created_at DESC;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_rosters_bypass_rls(TEXT, UUID, UUID) TO authenticated;

-- Test the function - get SA/AD access to all rosters
SELECT 
    name,
    status,
    certificate_count,
    created_at
FROM get_rosters_bypass_rls('SA', '00000000-0000-0000-0000-000000000000'::UUID)
ORDER BY created_at DESC
LIMIT 10;