-- FIX AP USER TEAM MEMBER ACCESS ISSUES
-- 
-- This migration addresses the 400 errors AP users get when trying to
-- change team member positions by fixing RLS policies and creating
-- proper team member management functions.

BEGIN;

-- 1. Create RLS policies for AP users on team_members table
DROP POLICY IF EXISTS "ap_users_can_manage_their_team_members" ON team_members;
CREATE POLICY "ap_users_can_manage_their_team_members" ON team_members
  FOR ALL
  TO authenticated
  USING (
    -- AP users can manage members of teams they are assigned to
    EXISTS (
      SELECT 1 
      FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      WHERE ap.user_id = auth.uid()
        AND pta.team_id = team_members.team_id
        AND pta.status = 'active'
        AND (pta.assignment_role = 'primary' OR pta.assignment_role = 'supervisor')
    )
  )
  WITH CHECK (
    -- Same condition for INSERT/UPDATE
    EXISTS (
      SELECT 1 
      FROM provider_team_assignments pta
      JOIN authorized_providers ap ON ap.id = pta.provider_id
      WHERE ap.user_id = auth.uid()
        AND pta.team_id = team_members.team_id
        AND pta.status = 'active'
        AND (pta.assignment_role = 'primary' OR pta.assignment_role = 'supervisor')
    )
  );

-- 2. Create safe team member management function for AP users
CREATE OR REPLACE FUNCTION update_team_member_role_safe(
  p_member_id uuid,
  p_new_role text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_current_user_id uuid;
  v_is_authorized boolean := false;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get team ID from member record
  SELECT team_id INTO v_team_id
  FROM team_members
  WHERE id = p_member_id;
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Team member not found';
  END IF;
  
  -- Check if current user is an AP with authority over this team
  SELECT EXISTS (
    SELECT 1 
    FROM provider_team_assignments pta
    JOIN authorized_providers ap ON ap.id = pta.provider_id
    WHERE ap.user_id = v_current_user_id
      AND pta.team_id = v_team_id
      AND pta.status = 'active'
      AND (pta.assignment_role = 'primary' OR pta.assignment_role = 'supervisor')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Insufficient permissions to manage this team member';
  END IF;
  
  -- Validate role - FIXED to use actual TEAM MEMBER roles from database
  IF p_new_role NOT IN ('ADMIN', 'MEMBER', 'admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid team roles are: ADMIN, MEMBER, admin, member', p_new_role;
  END IF;
  
  -- Update the member role
  UPDATE team_members
  SET 
    role = p_new_role,
    updated_at = now()
  WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update team member role';
  END IF;
  
  RAISE LOG 'Team member role updated: member_id=%, new_role=%, by_user=%', 
    p_member_id, p_new_role, v_current_user_id;
END;
$$;

-- 3. Create safe team member addition function
CREATE OR REPLACE FUNCTION add_team_member_safe(
  p_team_id uuid,
  p_user_id uuid,
  p_role text DEFAULT 'member'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_is_authorized boolean := false;
  v_member_id uuid;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if current user is an AP with authority over this team
  SELECT EXISTS (
    SELECT 1 
    FROM provider_team_assignments pta
    JOIN authorized_providers ap ON ap.id = pta.provider_id
    WHERE ap.user_id = v_current_user_id
      AND pta.team_id = p_team_id
      AND pta.status = 'active'
      AND (pta.assignment_role = 'primary' OR pta.assignment_role = 'supervisor')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Insufficient permissions to add members to this team';
  END IF;
  
  -- Validate role - FIXED to use actual TEAM MEMBER roles from database
  IF p_role NOT IN ('ADMIN', 'MEMBER', 'admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid team roles are: ADMIN, MEMBER, admin, member', p_role;
  END IF;
  
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found: %', p_user_id;
  END IF;
  
  -- Check if already a member
  IF EXISTS (SELECT 1 FROM team_members WHERE team_id = p_team_id AND user_id = p_user_id AND status = 'active') THEN
    RAISE EXCEPTION 'User is already a member of this team';
  END IF;
  
  -- Insert new team member
  INSERT INTO team_members (team_id, user_id, role, status, joined_at)
  VALUES (p_team_id, p_user_id, p_role, 'active', now())
  RETURNING id INTO v_member_id;
  
  RAISE LOG 'Team member added: team_id=%, user_id=%, role=%, by_user=%', 
    p_team_id, p_user_id, p_role, v_current_user_id;
  
  RETURN v_member_id;
END;
$$;

-- 4. Create safe team member removal function
CREATE OR REPLACE FUNCTION remove_team_member_safe(
  p_member_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_current_user_id uuid;
  v_is_authorized boolean := false;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get team ID from member record
  SELECT team_id INTO v_team_id
  FROM team_members
  WHERE id = p_member_id AND status = 'active';
  
  IF v_team_id IS NULL THEN
    RAISE EXCEPTION 'Active team member not found';
  END IF;
  
  -- Check if current user is an AP with authority over this team
  SELECT EXISTS (
    SELECT 1 
    FROM provider_team_assignments pta
    JOIN authorized_providers ap ON ap.id = pta.provider_id
    WHERE ap.user_id = v_current_user_id
      AND pta.team_id = v_team_id
      AND pta.status = 'active'
      AND (pta.assignment_role = 'primary' OR pta.assignment_role = 'supervisor')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Insufficient permissions to remove members from this team';
  END IF;
  
  -- Soft delete the member
  UPDATE team_members
  SET 
    status = 'inactive',
    updated_at = now()
  WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to remove team member';
  END IF;
  
  RAISE LOG 'Team member removed: member_id=%, team_id=%, by_user=%', 
    p_member_id, v_team_id, v_current_user_id;
  
  RETURN true;
END;
$$;

-- 5. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_team_member_role_safe(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION add_team_member_safe(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_team_member_safe(uuid) TO authenticated;

-- 6. Create function to get team member count with proper permissions
CREATE OR REPLACE FUNCTION get_team_member_count(p_team_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM team_members
  WHERE team_id = p_team_id AND status = 'active';
  
  RETURN COALESCE(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_team_member_count(uuid) TO authenticated;

-- 7. Add helpful comments
COMMENT ON POLICY "ap_users_can_manage_their_team_members" ON team_members IS 
'Allows AP users to manage team members for teams they are assigned to with primary or supervisor roles';

COMMENT ON FUNCTION update_team_member_role_safe(uuid, text) IS 
'Safe function for AP users to update team member roles with proper authorization checks';

COMMENT ON FUNCTION add_team_member_safe(uuid, uuid, text) IS 
'Safe function for AP users to add team members with proper authorization checks';

COMMENT ON FUNCTION remove_team_member_safe(uuid) IS 
'Safe function for AP users to remove team members with proper authorization checks';

COMMIT;