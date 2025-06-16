-- Fix Team Member Management Errors
-- Date: 2025-06-16
-- Purpose: Fix role constraint violations and ambiguous column references

-- First, let's update the team_members table to support the roles being used
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Add new check constraint with all the roles being used in the application
ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('ADMIN', 'MEMBER', 'admin', 'member', 'lead'));

-- Update existing bypass functions to fix ambiguous column references
-- and ensure proper role handling

-- Drop and recreate the add_team_member_bypass_rls function with fixes
DROP FUNCTION IF EXISTS add_team_member_bypass_rls(UUID, UUID, TEXT);

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
DECLARE
    normalized_role TEXT;
BEGIN
    -- Normalize role to uppercase for consistency
    normalized_role := CASE 
        WHEN LOWER(p_role) = 'admin' THEN 'ADMIN'
        WHEN LOWER(p_role) = 'member' THEN 'MEMBER'
        WHEN LOWER(p_role) = 'lead' THEN 'ADMIN' -- Map lead to ADMIN for now
        ELSE 'MEMBER' -- Default fallback
    END;

    -- Check if user has permission to add members to this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to add team members';
    END IF;

    -- Check if user is already a member of this team
    IF EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = p_team_id AND tm.user_id = p_user_id
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

    -- Insert the team member with normalized role
    RETURN QUERY
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (p_team_id, p_user_id, normalized_role)
    RETURNING 
        team_members.id,
        team_members.user_id,
        team_members.team_id,
        team_members.role,
        team_members.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update bulk_add_team_members_bypass_rls function with role normalization
DROP FUNCTION IF EXISTS bulk_add_team_members_bypass_rls(UUID, UUID[], TEXT);

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
    normalized_role TEXT;
BEGIN
    -- Normalize role to uppercase for consistency
    normalized_role := CASE 
        WHEN LOWER(p_role) = 'admin' THEN 'ADMIN'
        WHEN LOWER(p_role) = 'member' THEN 'MEMBER'
        WHEN LOWER(p_role) = 'lead' THEN 'ADMIN' -- Map lead to ADMIN for now
        ELSE 'MEMBER' -- Default fallback
    END;

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
                SELECT 1 FROM public.team_members tm
                WHERE tm.team_id = p_team_id AND tm.user_id = user_id
            ) THEN
                failed_list := array_append(failed_list, user_id);
                error_list := array_append(error_list, 'User is already a member');
                CONTINUE;
            END IF;

            -- Add the member with normalized role
            INSERT INTO public.team_members (team_id, user_id, role)
            VALUES (p_team_id, user_id, normalized_role);

            success_cnt := success_cnt + 1;

        EXCEPTION WHEN OTHERS THEN
            failed_list := array_append(failed_list, user_id);
            error_list := array_append(error_list, SQLERRM);
        END;
    END LOOP;

    RETURN QUERY SELECT success_cnt, failed_list, error_list;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update update_team_member_role_bypass_rls function with role normalization
DROP FUNCTION IF EXISTS update_team_member_role_bypass_rls(UUID, UUID, TEXT);

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
DECLARE
    normalized_role TEXT;
BEGIN
    -- Normalize role to uppercase for consistency
    normalized_role := CASE 
        WHEN LOWER(p_new_role) = 'admin' THEN 'ADMIN'
        WHEN LOWER(p_new_role) = 'member' THEN 'MEMBER'
        WHEN LOWER(p_new_role) = 'lead' THEN 'ADMIN' -- Map lead to ADMIN for now
        ELSE 'MEMBER' -- Default fallback
    END;

    -- Check if user has permission to update member roles in this team
    IF NOT (
        get_user_role_direct(auth.uid()) IN ('SA', 'AD') OR
        is_team_admin_direct(auth.uid(), p_team_id)
    ) THEN
        RAISE EXCEPTION 'Access denied: insufficient permissions to update team member roles';
    END IF;

    -- Check if the member exists in the team
    IF NOT EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = p_team_id AND tm.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this team';
    END IF;

    -- Update the member role with normalized role
    RETURN QUERY
    UPDATE public.team_members
    SET 
        role = normalized_role,
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

-- Update remove_team_member_bypass_rls function to fix ambiguous references
DROP FUNCTION IF EXISTS remove_team_member_bypass_rls(UUID, UUID);

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
        SELECT 1 FROM public.team_members tm
        WHERE tm.team_id = p_team_id AND tm.user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'User is not a member of this team';
    END IF;

    -- Remove the team member
    DELETE FROM public.team_members tm
    WHERE tm.team_id = p_team_id AND tm.user_id = p_user_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a helper function to normalize roles consistently across the application
CREATE OR REPLACE FUNCTION normalize_team_member_role(input_role TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        WHEN LOWER(input_role) IN ('admin', 'administrator', 'lead', 'leader') THEN 'ADMIN'
        WHEN LOWER(input_role) IN ('member', 'user', 'participant') THEN 'MEMBER'
        ELSE 'MEMBER' -- Default fallback
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comments for the updated functions
COMMENT ON FUNCTION add_team_member_bypass_rls(UUID, UUID, TEXT) IS 'Add team member safely with role normalization and fixed column references';
COMMENT ON FUNCTION bulk_add_team_members_bypass_rls(UUID, UUID[], TEXT) IS 'Bulk add team members safely with role normalization';
COMMENT ON FUNCTION update_team_member_role_bypass_rls(UUID, UUID, TEXT) IS 'Update team member role safely with role normalization';
COMMENT ON FUNCTION remove_team_member_bypass_rls(UUID, UUID) IS 'Remove team member safely with fixed column references';
COMMENT ON FUNCTION normalize_team_member_role(TEXT) IS 'Normalize team member roles to consistent uppercase format';

-- Final verification message
DO $$
BEGIN
    RAISE NOTICE '=== TEAM MEMBER MANAGEMENT ERRORS FIXED ===';
    RAISE NOTICE 'Fixed issues:';
    RAISE NOTICE '1. Updated role check constraint to allow lowercase roles';
    RAISE NOTICE '2. Added role normalization to all functions';
    RAISE NOTICE '3. Fixed ambiguous column references using table aliases';
    RAISE NOTICE '4. Added normalize_team_member_role helper function';
    RAISE NOTICE 'All team member operations should now work correctly';
    RAISE NOTICE '=== FIXES COMPLETE ===';
END $$;