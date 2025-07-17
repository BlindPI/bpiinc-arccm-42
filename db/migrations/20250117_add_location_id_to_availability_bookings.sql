-- Migration: Add location_id column to availability_bookings table
-- Date: 2025-01-17
-- Purpose: Fix missing location_id column and add proper foreign key relationships

-- Add location_id column to availability_bookings table
ALTER TABLE availability_bookings 
ADD COLUMN location_id uuid REFERENCES locations(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_availability_bookings_location_id 
ON availability_bookings(location_id);

-- Add index for compound queries (location + date)
CREATE INDEX IF NOT EXISTS idx_availability_bookings_location_date 
ON availability_bookings(location_id, booking_date);

-- Update existing RLS policies to include location-based access control
-- First, drop existing policies to recreate them with location support

-- Drop existing policies (if they exist)
DROP POLICY IF EXISTS "availability_bookings_select_policy" ON availability_bookings;
DROP POLICY IF EXISTS "availability_bookings_insert_policy" ON availability_bookings;
DROP POLICY IF EXISTS "availability_bookings_update_policy" ON availability_bookings;
DROP POLICY IF EXISTS "availability_bookings_delete_policy" ON availability_bookings;

-- Create comprehensive RLS policies with location support
CREATE POLICY "availability_bookings_select_policy" ON availability_bookings
    FOR SELECT USING (
        -- Super admins can see all
        auth.jwt() ->> 'role' = 'SA' OR
        -- Admins can see all  
        auth.jwt() ->> 'role' = 'AD' OR
        -- Enterprise roles can see all
        auth.jwt() ->> 'role' IN ('EA', 'EM', 'EC') OR
        -- Instructors can see their own bookings
        (auth.jwt() ->> 'role' IN ('IT', 'IP', 'IC') AND user_id = auth.uid()) OR
        -- Team members can see bookings for their team/location
        (
            EXISTS (
                SELECT 1 FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                WHERE tm.user_id = auth.uid() 
                AND (t.location_id = availability_bookings.location_id OR availability_bookings.location_id IS NULL)
            )
        ) OR
        -- Users can see bookings they created
        created_by = auth.uid() OR
        -- Users in same location can see public bookings
        (
            EXISTS (
                SELECT 1 FROM profiles p
                WHERE p.id = auth.uid() 
                AND (p.location_id = availability_bookings.location_id OR availability_bookings.location_id IS NULL)
            )
        )
    );

CREATE POLICY "availability_bookings_insert_policy" ON availability_bookings
    FOR INSERT WITH CHECK (
        -- Super admins can insert anywhere
        auth.jwt() ->> 'role' = 'SA' OR
        -- Admins can insert anywhere
        auth.jwt() ->> 'role' = 'AD' OR
        -- Enterprise roles can insert anywhere
        auth.jwt() ->> 'role' IN ('EA', 'EM', 'EC') OR
        -- Instructors can create their own bookings
        (auth.jwt() ->> 'role' IN ('IT', 'IP', 'IC') AND user_id = auth.uid()) OR
        -- Team leads can create bookings for their location/team
        (
            auth.jwt() ->> 'role' IN ('TL', 'TM') AND
            EXISTS (
                SELECT 1 FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                WHERE tm.user_id = auth.uid() 
                AND (t.location_id = location_id OR location_id IS NULL)
                AND tm.role IN ('LEAD', 'MANAGER')
            )
        )
    );

CREATE POLICY "availability_bookings_update_policy" ON availability_bookings
    FOR UPDATE USING (
        -- Super admins can update all
        auth.jwt() ->> 'role' = 'SA' OR
        -- Admins can update all
        auth.jwt() ->> 'role' = 'AD' OR
        -- Enterprise roles can update all
        auth.jwt() ->> 'role' IN ('EA', 'EM', 'EC') OR
        -- Instructors can update their own bookings
        (auth.jwt() ->> 'role' IN ('IT', 'IP', 'IC') AND user_id = auth.uid()) OR
        -- Users can update bookings they created
        created_by = auth.uid() OR
        -- Team leads can update bookings in their location
        (
            auth.jwt() ->> 'role' IN ('TL', 'TM') AND
            EXISTS (
                SELECT 1 FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                WHERE tm.user_id = auth.uid() 
                AND (t.location_id = location_id OR location_id IS NULL)
                AND tm.role IN ('LEAD', 'MANAGER')
            )
        )
    );

CREATE POLICY "availability_bookings_delete_policy" ON availability_bookings
    FOR DELETE USING (
        -- Super admins can delete all
        auth.jwt() ->> 'role' = 'SA' OR
        -- Admins can delete all
        auth.jwt() ->> 'role' = 'AD' OR
        -- Enterprise roles can delete all
        auth.jwt() ->> 'role' IN ('EA', 'EM', 'EC') OR
        -- Instructors can delete their own bookings
        (auth.jwt() ->> 'role' IN ('IT', 'IP', 'IC') AND user_id = auth.uid()) OR
        -- Users can delete bookings they created
        created_by = auth.uid() OR
        -- Team leads can delete bookings in their location
        (
            auth.jwt() ->> 'role' IN ('TL', 'TM') AND
            EXISTS (
                SELECT 1 FROM team_members tm
                JOIN teams t ON tm.team_id = t.id
                WHERE tm.user_id = auth.uid() 
                AND (t.location_id = location_id OR location_id IS NULL)
                AND tm.role IN ('LEAD', 'MANAGER')
            )
        )
    );

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_availability_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_availability_bookings_updated_at_trigger ON availability_bookings;
CREATE TRIGGER update_availability_bookings_updated_at_trigger
    BEFORE UPDATE ON availability_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_availability_bookings_updated_at();

-- Add comment for documentation
COMMENT ON COLUMN availability_bookings.location_id IS 'Foreign key reference to locations table for multi-location support and proper access control';

-- First, update any existing training/course bookings to have a default location_id
-- if they don't have one. We'll try to get a location from related data or use a default.
DO $$
DECLARE
    default_location_id uuid;
    updated_count integer;
BEGIN
    -- Get the first available location as default
    SELECT id INTO default_location_id FROM locations WHERE status = 'ACTIVE' LIMIT 1;
    
    -- If we have a default location, update records that need it
    IF default_location_id IS NOT NULL THEN
        -- Update training_session and course_instruction bookings that don't have location_id
        UPDATE availability_bookings
        SET location_id = default_location_id
        WHERE location_id IS NULL
        AND booking_type IN ('training_session', 'course_instruction');
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % rows with default location_id: %',
                     updated_count, default_location_id;
    ELSE
        RAISE NOTICE 'No active locations found - skipping location_id updates';
    END IF;
END $$;

-- Now add constraint to ensure booking_type is compatible with location requirements
-- (This helps with multi-course session support)
ALTER TABLE availability_bookings
ADD CONSTRAINT check_location_booking_type
CHECK (
    -- Training sessions and course instruction should have a location
    (booking_type IN ('training_session', 'course_instruction') AND location_id IS NOT NULL) OR
    -- Other booking types can be location-agnostic
    booking_type NOT IN ('training_session', 'course_instruction')
);

-- Create a view for easier querying of availability bookings with location info
CREATE OR REPLACE VIEW availability_bookings_with_location AS
SELECT 
    ab.*,
    l.name as location_name,
    l.city as location_city,
    l.state as location_state,
    p.display_name as user_display_name,
    p.email as user_email,
    creator.display_name as created_by_name
FROM availability_bookings ab
LEFT JOIN locations l ON ab.location_id = l.id
LEFT JOIN profiles p ON ab.user_id = p.id
LEFT JOIN profiles creator ON ab.created_by = creator.id;

-- Grant appropriate permissions on the view
GRANT SELECT ON availability_bookings_with_location TO authenticated;

-- Add helpful indexes for multi-course session support
CREATE INDEX IF NOT EXISTS idx_availability_bookings_course_sequence 
ON availability_bookings USING GIN(course_sequence);

-- Add index for team-based queries
CREATE INDEX IF NOT EXISTS idx_availability_bookings_team_id 
ON availability_bookings(team_id);

-- Add index for bulk operations
CREATE INDEX IF NOT EXISTS idx_availability_bookings_bulk_operation_id 
ON availability_bookings(bulk_operation_id);

-- Enable RLS on the table (if not already enabled)
ALTER TABLE availability_bookings ENABLE ROW LEVEL SECURITY;

-- Create a function to help with multi-course session management
CREATE OR REPLACE FUNCTION get_location_availability(
    p_location_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS TABLE (
    booking_date date,
    total_bookings bigint,
    training_sessions bigint,
    available_slots bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ab.booking_date,
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE ab.booking_type IN ('training_session', 'course_instruction')) as training_sessions,
        -- Assume max 10 concurrent sessions per location per day (configurable)
        GREATEST(0, 10 - COUNT(*)) as available_slots
    FROM availability_bookings ab
    WHERE ab.location_id = p_location_id
    AND ab.booking_date BETWEEN p_start_date AND p_end_date
    AND ab.status != 'cancelled'
    GROUP BY ab.booking_date
    ORDER BY ab.booking_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_location_availability(uuid, date, date) TO authenticated;