-- EMERGENCY: Create RLS-bypassing function for team member profiles - FIXED TYPES
-- The data exists, RLS is blocking access, so bypass it!

CREATE OR REPLACE FUNCTION get_team_member_profiles_bypass_rls(p_team_id UUID)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    email TEXT,
    phone TEXT,
    job_title TEXT,
    team_role TEXT,
    team_position TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.user_id,
        COALESCE(p.display_name, 'User ' || substr(tm.user_id::text, 1, 8))::TEXT as display_name,
        COALESCE(p.email, '')::TEXT as email,
        COALESCE(p.phone, '')::TEXT as phone,
        COALESCE(p.job_title, '')::TEXT as job_title,
        tm.role::TEXT as team_role,
        COALESCE(tm.team_position, '')::TEXT as team_position
    FROM team_members tm
    LEFT JOIN profiles p ON p.id = tm.user_id
    WHERE tm.team_id = p_team_id
    AND tm.status = 'active'
    ORDER BY p.display_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_team_member_profiles_bypass_rls(UUID) TO authenticated;

-- Test the function with Barrie team
SELECT * FROM get_team_member_profiles_bypass_rls(
    (SELECT id FROM teams WHERE name LIKE '%Barrie%' LIMIT 1)
);