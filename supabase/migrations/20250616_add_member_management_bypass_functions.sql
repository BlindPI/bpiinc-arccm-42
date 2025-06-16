-- Add Member Management Bypass Functions
-- Date: 2025-06-16
-- Purpose: Add RPC functions to safely manage team members without RLS issues

-- Function to add team member safely
CREATE OR REPLACE FUNCTION add_team_member_bypass_rls(
    p_team_id UUID,
    p_user_id UUID,
    p_role TEXT DEFAULT 'member'
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    team_id UUID,
    role TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if user has permission to add members to this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to add team members';
    END IF;

    -- Check if user is already a member of this team
    IF EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = p_team_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is already a member of this team';
    END IF;

    -- Check if the user exists
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User does not exist';
    END IF;

    -- Check if the team exists
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = p_team_id
    ) THEN
        RAISE EXCEPTION 'Team does not exist';
    END IF;

    -- Insert the team member
    RETURN QUERY
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (p_team_id, p_user_id, p_role)
    RETURNING 
        team_members.id,
        team_members.user_id,
        team_members.team_id,
        team_members.role,
        team_members.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove team member safely
CREATE OR REPLACE FUNCTION remove_team_member_bypass_rls(
    p_team_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if user has permission to remove members from this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id) OR
        auth.uid() = p_user_id  -- Users can remove themselves
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to remove team members';
    END IF;

    -- Check if the member exists in the team
    IF NOT EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = p_team_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this team';
    END IF;

    -- Remove the team member
    DELETE FROM public.team_members
    WHERE team_id = p_team_id AND user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to bulk add team members safely
CREATE OR REPLACE FUNCTION bulk_add_team_members_bypass_rls(
    p_team_id UUID,
    p_user_ids UUID[],
    p_role TEXT DEFAULT 'member'
)
RETURNS TABLE(
    success_count INTEGER,
    failed_users UUID[],
    error_messages TEXT[]
) AS $$
DECLARE
    user_id UUID;
    success_cnt INTEGER := 0;
    failed_list UUID[] := ARRAY[]::UUID[];
    error_list TEXT[] := ARRAY[]::TEXT[];
    error_msg TEXT;
BEGIN
    -- Check if user has permission to add members to this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to add team members';
    END IF;

    -- Check if the team exists
    IF NOT EXISTS (
        SELECT 1 FROM public.teams WHERE id = p_team_id
    ) THEN
        RAISE EXCEPTION 'Team does not exist';
    END IF;

    -- Process each user
    FOREACH user_id IN ARRAY p_user_ids
    LOOP
        BEGIN
            -- Check if user exists
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
                failed_list := array_append(failed_list, user_id);
                error_list := array_append(error_list, 'User does not exist');
                CONTINUE;
            END IF;

            -- Check if user is already a member
            IF EXISTS (
                SELECT 1 FROM public.team_members 
                WHERE team_id = p_team_id AND user_id = user_id
            ) THEN
                failed_list := array_append(failed_list, user_id);
                error_list := array_append(error_list, 'User is already a member');
                CONTINUE;
            END IF;

            -- Add the member
            INSERT INTO public.team_members (team_id, user_id, role)
            VALUES (p_team_id, user_id, p_role);

            success_cnt := success_cnt + 1;

        EXCEPTION WHEN OTHERS THEN
            failed_list := array_append(failed_list, user_id);
            error_list := array_append(error_list, SQLERRM);
        END;
    END LOOP;

    RETURN QUERY SELECT success_cnt, failed_list, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update team member role safely
CREATE OR REPLACE FUNCTION update_team_member_role_bypass_rls(
    p_team_id UUID,
    p_user_id UUID,
    p_new_role TEXT
)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    team_id UUID,
    role TEXT,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    -- Check if user has permission to update member roles in this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to update team member roles';
    END IF;

    -- Check if the member exists in the team
    IF NOT EXISTS (
        SELECT 1 FROM public.team_members 
        WHERE team_id = p_team_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this team';
    END IF;

    -- Validate the role
    IF p_new_role NOT IN ('member', 'lead', 'admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be one of: member, lead, admin';
    END IF;

    -- Update the member role
    RETURN QUERY
    UPDATE public.team_members
    SET 
        role = p_new_role,
        updated_at = NOW()
    WHERE team_id = p_team_id AND user_id = p_user_id
    RETURNING 
        team_members.id,
        team_members.user_id,
        team_members.team_id,
        team_members.role,
        team_members.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available users for team (not already members)
CREATE OR REPLACE FUNCTION get_available_users_for_team_bypass_rls(p_team_id UUID)
RETURNS TABLE(
    id UUID,
    display_name TEXT,
    email TEXT,
    role TEXT
) AS $$
BEGIN
    -- Check if user has permission to view available users for this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_member_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to view available users';
    END IF;

    -- Return users who are not already members of this team
    RETURN QUERY
    SELECT 
        p.id,
        p.display_name,
        p.email,
        p.role
    FROM public.profiles p
    WHERE p.id NOT IN (
        SELECT tm.user_id 
        FROM public.team_members tm 
        WHERE tm.team_id = p_team_id
    )
    AND p.display_name IS NOT NULL
    ORDER BY p.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comprehensive comments
COMMENT ON FUNCTION add_team_member_bypass_rls(UUID, UUID, TEXT) IS 'Add team member safely without triggering RLS recursion - includes permission checks';
COMMENT ON FUNCTION remove_team_member_bypass_rls(UUID, UUID) IS 'Remove team member safely without triggering RLS recursion - includes permission checks';
COMMENT ON FUNCTION bulk_add_team_members_bypass_rls(UUID, UUID[], TEXT) IS 'Bulk add team members safely with error handling';
COMMENT ON FUNCTION update_team_member_role_bypass_rls(UUID, UUID, TEXT) IS 'Update team member role safely without triggering RLS recursion';
COMMENT ON FUNCTION get_available_users_for_team_bypass_rls(UUID) IS 'Get users available to add to team (not already members)';

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== MEMBER MANAGEMENT BYPASS FUNCTIONS ADDED ===';
    RAISE NOTICE 'New functions created for safe team member operations:';
    RAISE NOTICE '- add_team_member_bypass_rls';
    RAISE NOTICE '- remove_team_member_bypass_rls';
    RAISE NOTICE '- bulk_add_team_members_bypass_rls';
    RAISE NOTICE '- update_team_member_role_bypass_rls';
    RAISE NOTICE '- get_available_users_for_team_bypass_rls';
    RAISE NOTICE 'All functions include proper permission checks and error handling';
    RAISE NOTICE '=== MEMBER MANAGEMENT FUNCTIONS READY ===';
END $$;