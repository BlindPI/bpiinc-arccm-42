-- Expand user_availability table to support both weekly recurring and specific date availability
-- This enables monthly calendar functionality while maintaining existing weekly patterns

-- Add new columns to support specific date availability
ALTER TABLE user_availability 
ADD COLUMN IF NOT EXISTS specific_date DATE,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS date_override BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN user_availability.specific_date IS 'Specific date for non-recurring availability (overrides day_of_week)';
COMMENT ON COLUMN user_availability.is_recurring IS 'Whether this availability entry repeats based on recurring_pattern';
COMMENT ON COLUMN user_availability.date_override IS 'Whether this entry overrides recurring availability for a specific date';

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_user_availability_specific_date 
ON user_availability(user_id, specific_date) 
WHERE specific_date IS NOT NULL;

-- Create index for mixed queries (recurring + specific dates)
CREATE INDEX IF NOT EXISTS idx_user_availability_mixed 
ON user_availability(user_id, day_of_week, specific_date, is_active);

-- Update the constraint to make day_of_week nullable when specific_date is used
-- First, let's make day_of_week nullable
ALTER TABLE user_availability 
ALTER COLUMN day_of_week DROP NOT NULL;

-- Add a check constraint to ensure either day_of_week OR specific_date is provided
ALTER TABLE user_availability 
ADD CONSTRAINT check_availability_date_or_dow 
CHECK (
  (day_of_week IS NOT NULL AND is_recurring = true) OR 
  (specific_date IS NOT NULL AND is_recurring = false)
);

-- Function to get user availability for a specific date range (monthly view)
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
    -- AP users can see team members they have access to
    SELECT ARRAY(
      SELECT DISTINCT tm.user_id
      FROM team_members tm
      JOIN team_members tm2 ON tm.team_id = tm2.team_id
      WHERE tm2.user_id = requesting_user_id
        AND tm.status = 'active'
        AND tm2.status = 'active'
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
      ua.availability_type,
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
      ua.day_of_week,
      ua.start_time,
      ua.end_time,
      ua.availability_type,
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
      AND ua.day_of_week = EXTRACT(DOW FROM ds.date)
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

-- Create RLS policies for the new columns
-- The existing RLS policies should cover the new columns automatically, 
-- but let's ensure they work with the new structure

-- Update existing RLS policies if needed (this is a safety measure)
DO $$
BEGIN
  -- Check if policies exist and update them to work with new columns
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_availability') THEN
    -- Policies already exist, they should work with new columns
    RAISE NOTICE 'Existing RLS policies found for user_availability table';
  END IF;
END;
$$;

-- Add helpful view for monthly calendar display
CREATE OR REPLACE VIEW monthly_user_availability AS
SELECT 
  ua.id,
  ua.user_id,
  ua.specific_date,
  ua.day_of_week,
  ua.start_time,
  ua.end_time,
  ua.availability_type,
  ua.recurring_pattern,
  ua.is_recurring,
  ua.date_override,
  ua.notes,
  ua.is_active,
  p.display_name,
  p.email,
  p.role,
  CASE 
    WHEN ua.is_recurring = false THEN ua.specific_date
    ELSE NULL
  END as display_date,
  CASE 
    WHEN ua.is_recurring = true THEN ua.day_of_week
    ELSE EXTRACT(DOW FROM ua.specific_date)
  END as display_day_of_week
FROM user_availability ua
JOIN profiles p ON p.id = ua.user_id
WHERE ua.is_active = true;

-- Grant access to the view
GRANT SELECT ON monthly_user_availability TO authenticated;

COMMENT ON VIEW monthly_user_availability IS 'Unified view of user availability supporting both recurring and specific date patterns for monthly calendar display';