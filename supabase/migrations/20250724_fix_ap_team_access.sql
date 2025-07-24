-- Fix AP user team access - use provider_team_assignments and team_availability_permissions
-- AP users should see their team members' availability through provider assignments

CREATE OR REPLACE FUNCTION get_user_availability_for_date_range(
  start_date DATE,
  end_date DATE,
  user_ids UUID[] DEFAULT NULL,
  requesting_user_id UUID DEFAULT NULL,
  requesting_user_role TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  availability_date DATE,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  availability_type TEXT,
  recurring_pattern TEXT,
  is_recurring BOOLEAN,
  specific_date DATE,
  notes TEXT,
  display_name TEXT,
  email TEXT,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date DATE;
  allowed_user_ids UUID[];
BEGIN
  -- Role-based access control
  IF requesting_user_role = 'SA' OR requesting_user_role = 'AD' THEN
    -- SA/AD can see all users
    allowed_user_ids := user_ids;
  ELSIF requesting_user_role = 'AP' THEN
    -- AP users can see:
    -- 1. Team members from teams they're assigned to via provider_team_assignments
    -- 2. Users they have explicit permissions for via team_availability_permissions
    -- 3. Their own availability
    SELECT ARRAY(
      SELECT DISTINCT tm.user_id
      FROM team_members tm
      JOIN provider_team_assignments pta ON tm.team_id = pta.team_id
      JOIN authorized_providers ap ON pta.provider_id = ap.id
      WHERE ap.user_id = requesting_user_id
        AND tm.status = 'active'
        AND pta.status = 'active'
      
      UNION
      
      SELECT DISTINCT tm.user_id
      FROM team_members tm
      JOIN team_availability_permissions tap ON tm.team_id = tap.team_id
      WHERE tap.manager_id = requesting_user_id
        AND tm.status = 'active'
        AND (tap.expires_at IS NULL OR tap.expires_at > NOW())
      
      UNION
      
      SELECT requesting_user_id  -- Include their own availability
    ) INTO allowed_user_ids;
    
    -- If no user_ids specified, use all accessible users
    IF user_ids IS NULL THEN
      user_ids := allowed_user_ids;
    ELSE
      -- Filter requested user_ids to only those the AP user can access
      user_ids := ARRAY(
        SELECT unnest(user_ids) 
        INTERSECT 
        SELECT unnest(allowed_user_ids)
      );
    END IF;
  ELSE
    -- IC/IP/IT/IN users can only see their own availability
    user_ids := ARRAY[requesting_user_id];
  END IF;

  -- Return availability for the date range
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT start_date as date
    UNION ALL
    SELECT (date + INTERVAL '1 day')::DATE
    FROM date_series
    WHERE date < end_date
  ),
  expanded_availability AS (
    -- Specific date availability (non-recurring)
    SELECT 
      ua.id,
      ua.user_id,
      ua.specific_date as availability_date,
      NULL::INTEGER as day_of_week,
      ua.start_time,
      ua.end_time,
      ua.availability_type::TEXT,
      ua.recurring_pattern,
      ua.is_recurring,
      ua.specific_date,
      ua.notes,
      p.display_name,
      p.email,
      p.role
    FROM user_availability ua
    JOIN profiles p ON p.id = ua.user_id
    WHERE ua.specific_date BETWEEN start_date AND end_date
      AND ua.is_active = true
      AND ua.is_recurring = false
      AND (user_ids IS NULL OR ua.user_id = ANY(user_ids))
      
    UNION ALL
    
    -- Recurring availability expanded to specific dates
    SELECT 
      ua.id,
      ua.user_id,
      ds.date as availability_date,
      ua.day_of_week::TEXT::INTEGER as day_of_week,
      ua.start_time,
      ua.end_time,
      ua.availability_type::TEXT,
      ua.recurring_pattern,
      ua.is_recurring,
      ua.specific_date,
      ua.notes,
      p.display_name,
      p.email,
      p.role
    FROM user_availability ua
    JOIN profiles p ON p.id = ua.user_id
    CROSS JOIN date_series ds
    WHERE ua.is_recurring = true
      AND ua.is_active = true
      AND ua.day_of_week IS NOT NULL
      AND ua.day_of_week::TEXT = EXTRACT(DOW FROM ds.date)::TEXT
      AND (ua.effective_date IS NULL OR ds.date >= ua.effective_date)
      AND (ua.expiry_date IS NULL OR ds.date <= ua.expiry_date)
      AND (user_ids IS NULL OR ua.user_id = ANY(user_ids))
      -- Exclude dates that have specific overrides
      AND NOT EXISTS (
        SELECT 1 FROM user_availability ua_override
        WHERE ua_override.user_id = ua.user_id
          AND ua_override.specific_date = ds.date
          AND ua_override.date_override = true
          AND ua_override.is_active = true
      )
  )
  SELECT * FROM expanded_availability
  ORDER BY availability_date, start_time, display_name;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_availability_for_date_range TO authenticated;

COMMENT ON FUNCTION get_user_availability_for_date_range IS 'Fixed AP access to use provider_team_assignments and team_availability_permissions';