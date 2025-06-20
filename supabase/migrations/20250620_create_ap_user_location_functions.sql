-- Create functions for AP user location management

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_available_ap_users_for_location(UUID);
DROP FUNCTION IF EXISTS assign_ap_user_to_location(UUID, UUID, TEXT, DATE);
DROP FUNCTION IF EXISTS get_ap_user_assignments(UUID);
DROP FUNCTION IF EXISTS get_ap_users_by_location(UUID);

-- Function to get available AP users for a location (not yet assigned)
CREATE OR REPLACE FUNCTION get_available_ap_users_for_location(p_location_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  phone TEXT,
  organization TEXT,
  job_title TEXT,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    p.email,
    p.phone,
    p.organization,
    p.job_title,
    p.created_at
  FROM profiles p
  WHERE p.role = 'AP' 
    AND p.status = 'ACTIVE'
    AND (p.location_id IS NULL OR p.location_id = p_location_id)
    AND p.id NOT IN (
      SELECT ap.user_id
      FROM authorized_providers ap
      WHERE ap.location_id = p_location_id 
        AND ap.status = 'APPROVED'
    );
END;
$$;

-- Function to assign AP user to location
CREATE OR REPLACE FUNCTION assign_ap_user_to_location(
  p_ap_user_id UUID,
  p_location_id UUID,
  p_assignment_role TEXT DEFAULT 'provider',
  p_end_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_ap_user RECORD;
BEGIN
  -- Verify AP user exists and is active
  SELECT id, display_name, email, organization
  INTO v_ap_user
  FROM profiles
  WHERE id = p_ap_user_id 
    AND role = 'AP' 
    AND status = 'ACTIVE';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'AP user not found or not active';
  END IF;
  
  -- Create authorized provider record
  INSERT INTO authorized_providers (
    user_id,
    name,
    provider_name,
    provider_url,
    provider_type,
    location_id,
    assignment_type,
    status,
    performance_rating,
    compliance_score,
    created_at,
    updated_at
  ) VALUES (
    p_ap_user_id,
    v_ap_user.display_name,
    v_ap_user.display_name,
    COALESCE(v_ap_user.organization, ''),
    'authorized_provider',
    p_location_id,
    'location_based',
    'APPROVED',
    0,
    0,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_assignment_id;
  
  -- Update profile location if not set
  UPDATE profiles 
  SET location_id = p_location_id,
      updated_at = NOW()
  WHERE id = p_ap_user_id 
    AND location_id IS NULL;
  
  RETURN v_assignment_id;
END;
$$;

-- Function to get AP user assignments with location details
CREATE OR REPLACE FUNCTION get_ap_user_assignments(p_ap_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  assignment_id UUID,
  ap_user_id UUID,
  ap_user_name TEXT,
  ap_user_email TEXT,
  location_id UUID,
  location_name TEXT,
  location_city TEXT,
  location_state TEXT,
  assignment_role TEXT,
  status TEXT,
  start_date DATE,
  end_date DATE,
  team_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.id as assignment_id,
    ap.user_id as ap_user_id,
    p.display_name as ap_user_name,
    p.email as ap_user_email,
    ap.location_id,
    l.name as location_name,
    l.city as location_city,
    l.state as location_state,
    'provider' as assignment_role,
    ap.status,
    ap.created_at::DATE as start_date,
    NULL::DATE as end_date,
    COALESCE(team_counts.team_count, 0) as team_count
  FROM authorized_providers ap
  JOIN profiles p ON p.id = ap.user_id
  JOIN locations l ON l.id = ap.location_id
  LEFT JOIN (
    SELECT 
      assigned_ap_user_id,
      COUNT(*) as team_count
    FROM teams 
    WHERE assigned_ap_user_id IS NOT NULL
      AND status = 'active'
    GROUP BY assigned_ap_user_id
  ) team_counts ON team_counts.assigned_ap_user_id = ap.user_id
  WHERE ap.status = 'APPROVED'
    AND p.role = 'AP'
    AND (p_ap_user_id IS NULL OR ap.user_id = p_ap_user_id)
  ORDER BY p.display_name;
END;
$$;

-- Function to get AP users by location
CREATE OR REPLACE FUNCTION get_ap_users_by_location(p_location_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  email TEXT,
  organization TEXT,
  job_title TEXT,
  phone TEXT,
  assignment_status TEXT,
  team_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.display_name,
    p.email,
    p.organization,
    p.job_title,
    p.phone,
    CASE 
      WHEN ap.id IS NOT NULL THEN 'assigned'
      ELSE 'available'
    END as assignment_status,
    COALESCE(team_counts.team_count, 0) as team_count
  FROM profiles p
  LEFT JOIN authorized_providers ap ON ap.user_id = p.id 
    AND ap.location_id = p_location_id 
    AND ap.status = 'APPROVED'
  LEFT JOIN (
    SELECT 
      assigned_ap_user_id,
      COUNT(*) as team_count
    FROM teams 
    WHERE location_id = p_location_id
      AND assigned_ap_user_id IS NOT NULL
      AND status = 'active'
    GROUP BY assigned_ap_user_id
  ) team_counts ON team_counts.assigned_ap_user_id = p.id
  WHERE p.role = 'AP' 
    AND p.status = 'ACTIVE'
    AND (p.location_id IS NULL OR p.location_id = p_location_id)
  ORDER BY p.display_name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_available_ap_users_for_location(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_ap_user_to_location(UUID, UUID, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_user_assignments(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ap_users_by_location(UUID) TO authenticated;