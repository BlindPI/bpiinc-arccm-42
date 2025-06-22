-- FIX ROLE VALIDATION CASE SENSITIVITY
-- 
-- The team member roles are stored as uppercase (MEMBER, LEAD, etc.)
-- but the safe function validates against lowercase roles.

BEGIN;

-- Update the safe function to handle both uppercase and lowercase roles
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
  v_normalized_role text;
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
  
  -- Normalize role to lowercase for validation
  v_normalized_role := LOWER(p_new_role);
  
  -- Validate normalized role - FIXED to use actual TEAM MEMBER roles from database
  IF v_normalized_role NOT IN ('admin', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %. Valid team roles are: ADMIN, MEMBER, admin, member', p_new_role;
  END IF;
  
  -- Update the member role (keep original case as stored in database)
  UPDATE team_members
  SET 
    role = p_new_role,  -- Use original case from input
    updated_at = now()
  WHERE id = p_member_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Failed to update team member role';
  END IF;
  
  RAISE LOG 'Team member role updated: member_id=%, new_role=%, by_user=%', 
    p_member_id, p_new_role, v_current_user_id;
END;
$$;

-- Also update the add member function to handle case sensitivity
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
  v_normalized_role text;
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
  
  -- Normalize role to lowercase for validation
  v_normalized_role := LOWER(p_role);
  
  -- Validate normalized role - FIXED to use actual TEAM MEMBER roles from database
  IF v_normalized_role NOT IN ('admin', 'member') THEN
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
  
  -- Insert new team member (use original case from input)
  INSERT INTO team_members (team_id, user_id, role, status, joined_at)
  VALUES (p_team_id, p_user_id, p_role, 'active', now())
  RETURNING id INTO v_member_id;
  
  RAISE LOG 'Team member added: team_id=%, user_id=%, role=%, by_user=%', 
    p_team_id, p_user_id, p_role, v_current_user_id;
  
  RETURN v_member_id;
END;
$$;

-- Add comment
COMMENT ON FUNCTION update_team_member_role_safe(uuid, text) IS 
'Updated to handle both uppercase and lowercase role validation for team member role changes';

COMMENT ON FUNCTION add_team_member_safe(uuid, uuid, text) IS 
'Updated to handle both uppercase and lowercase role validation for adding team members';

COMMIT;