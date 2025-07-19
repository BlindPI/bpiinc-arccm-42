-- Roster Capacity Management System Enhancement
-- This migration enhances the existing student roster system with proper capacity validation
-- and automatic enrollment count management with robust error handling

-- ==============================================================================
-- PHASE 1: ENHANCE EXISTING TRIGGER FUNCTION FOR ROSTER ENROLLMENT UPDATES
-- ==============================================================================

-- Drop existing triggers and function to recreate with enhanced functionality
-- Handle all dependent triggers first
DROP TRIGGER IF EXISTS roster_enrollment_count_trigger ON roster_enrollments;
DROP TRIGGER IF EXISTS update_roster_count_trigger ON student_roster_members;
DROP TRIGGER IF EXISTS update_roster_enrollment_count ON student_roster_members;
DROP FUNCTION IF EXISTS update_roster_enrollment_count();

-- Create enhanced trigger function with comprehensive error handling and capacity validation
CREATE OR REPLACE FUNCTION update_roster_enrollment_count()
RETURNS TRIGGER AS $$
DECLARE
    v_max_capacity INTEGER;
    v_current_count INTEGER;
    v_roster_name TEXT;
BEGIN
    -- Handle INSERT operations (adding students)
    IF TG_OP = 'INSERT' THEN
        -- Get current roster information for capacity validation
        SELECT max_capacity, current_enrollment, roster_name 
        INTO v_max_capacity, v_current_count, v_roster_name
        FROM student_rosters 
        WHERE id = NEW.roster_id;
        
        -- Check if roster exists
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Roster with ID % does not exist', NEW.roster_id;
        END IF;
        
        -- Validate capacity before allowing enrollment
        IF v_max_capacity IS NOT NULL AND v_current_count >= v_max_capacity THEN
            RAISE EXCEPTION 'Cannot enroll student: Roster "%" is at full capacity (%) / %)', 
                v_roster_name, v_current_count, v_max_capacity
                USING HINT = 'Consider increasing max_capacity or removing existing enrollments';
        END IF;
        
        -- Update enrollment count
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment + 1,
            updated_at = NOW()
        WHERE id = NEW.roster_id;
        
        -- Log the enrollment for audit purposes
        RAISE NOTICE 'Student enrolled in roster "%": % / % capacity', 
            v_roster_name, v_current_count + 1, COALESCE(v_max_capacity, 'unlimited');
            
        RETURN NEW;
        
    -- Handle DELETE operations (removing students)
    ELSIF TG_OP = 'DELETE' THEN
        -- Update enrollment count (with safety check to prevent negative counts)
        UPDATE student_rosters 
        SET current_enrollment = GREATEST(0, current_enrollment - 1),
            updated_at = NOW()
        WHERE id = OLD.roster_id;
        
        -- Get roster name for logging
        SELECT roster_name INTO v_roster_name
        FROM student_rosters 
        WHERE id = OLD.roster_id;
        
        -- Log the unenrollment for audit purposes
        RAISE NOTICE 'Student unenrolled from roster "%"', COALESCE(v_roster_name, 'Unknown');
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment for documentation
COMMENT ON FUNCTION update_roster_enrollment_count() IS 
'Automatically maintains current_enrollment count in student_rosters table with capacity validation';

-- ==============================================================================
-- PHASE 2: CREATE DATABASE CONSTRAINTS FOR CAPACITY ENFORCEMENT
-- ==============================================================================

-- Add constraint to prevent current_enrollment from exceeding max_capacity
-- This provides an additional safety net beyond the trigger validation
ALTER TABLE student_rosters 
ADD CONSTRAINT check_enrollment_capacity 
CHECK (
    max_capacity IS NULL OR 
    current_enrollment IS NULL OR 
    current_enrollment <= max_capacity
);

-- Add constraint to ensure enrollment counts are never negative
ALTER TABLE student_rosters 
ADD CONSTRAINT check_enrollment_non_negative 
CHECK (current_enrollment >= 0);

-- Add constraint to ensure max_capacity is positive when specified
ALTER TABLE student_rosters 
ADD CONSTRAINT check_max_capacity_positive 
CHECK (max_capacity IS NULL OR max_capacity > 0);

-- Add helpful comments for documentation
COMMENT ON CONSTRAINT check_enrollment_capacity ON student_rosters IS 
'Ensures current enrollment never exceeds maximum capacity';
COMMENT ON CONSTRAINT check_enrollment_non_negative ON student_rosters IS 
'Ensures enrollment count is never negative';
COMMENT ON CONSTRAINT check_max_capacity_positive ON student_rosters IS 
'Ensures maximum capacity is positive when specified';

-- ==============================================================================
-- PHASE 3: CREATE PERFORMANCE INDEXES FOR ENROLLMENT QUERIES
-- ==============================================================================

-- Index for capacity management queries (roster with available spots)
CREATE INDEX IF NOT EXISTS idx_student_rosters_capacity_availability 
ON student_rosters (max_capacity, current_enrollment) 
WHERE max_capacity IS NOT NULL AND current_enrollment < max_capacity;

-- Index for enrollment status queries
CREATE INDEX IF NOT EXISTS idx_student_rosters_enrollment_status 
ON student_rosters (current_enrollment, max_capacity);

-- Index for roster member lookup optimization
CREATE INDEX IF NOT EXISTS idx_student_roster_members_roster_student 
ON student_roster_members (roster_id, student_profile_id);

-- Index for student enrollment history queries
CREATE INDEX IF NOT EXISTS idx_student_roster_members_student_created 
ON student_roster_members (student_profile_id, created_at);

-- Index for roster enrollment count queries
CREATE INDEX IF NOT EXISTS idx_student_roster_members_roster_created 
ON student_roster_members (roster_id, created_at);

-- Add helpful comments for index documentation
COMMENT ON INDEX idx_student_rosters_capacity_availability IS 
'Optimizes queries for rosters with available enrollment spots';
COMMENT ON INDEX idx_student_rosters_enrollment_status IS 
'Optimizes capacity status and utilization queries';
COMMENT ON INDEX idx_student_roster_members_roster_student IS 
'Optimizes roster membership validation and duplicate prevention';

-- ==============================================================================
-- PHASE 4: RECREATE TRIGGER WITH ENHANCED FUNCTIONALITY
-- ==============================================================================

-- Create the enhanced trigger for automatic enrollment count management
CREATE TRIGGER update_roster_enrollment_count
    AFTER INSERT OR DELETE ON student_roster_members
    FOR EACH ROW 
    EXECUTE FUNCTION update_roster_enrollment_count();

-- Add trigger comment for documentation
COMMENT ON TRIGGER update_roster_enrollment_count ON student_roster_members IS 
'Automatically updates enrollment counts and validates capacity limits';

-- ==============================================================================
-- PHASE 5: CREATE HELPER FUNCTION FOR CAPACITY VALIDATION
-- ==============================================================================

-- Create function to check roster capacity before enrollment
CREATE OR REPLACE FUNCTION check_roster_capacity(p_roster_id UUID, p_additional_students INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
    v_roster RECORD;
    v_available_spots INTEGER;
    v_result JSONB;
BEGIN
    -- Get roster information
    SELECT id, roster_name, max_capacity, current_enrollment
    INTO v_roster
    FROM student_rosters
    WHERE id = p_roster_id;
    
    -- Check if roster exists
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Roster not found',
            'roster_id', p_roster_id
        );
    END IF;
    
    -- Calculate available spots
    IF v_roster.max_capacity IS NULL THEN
        v_available_spots = NULL; -- Unlimited capacity
    ELSE
        v_available_spots = v_roster.max_capacity - COALESCE(v_roster.current_enrollment, 0);
    END IF;
    
    -- Build result
    v_result = jsonb_build_object(
        'success', true,
        'roster_id', v_roster.id,
        'roster_name', v_roster.roster_name,
        'max_capacity', v_roster.max_capacity,
        'current_enrollment', COALESCE(v_roster.current_enrollment, 0),
        'available_spots', v_available_spots,
        'can_enroll', (
            v_roster.max_capacity IS NULL OR 
            v_available_spots >= p_additional_students
        ),
        'requested_students', p_additional_students
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comment for function documentation
COMMENT ON FUNCTION check_roster_capacity(UUID, INTEGER) IS 
'Returns detailed capacity information for a roster including availability status';

-- ==============================================================================
-- PHASE 6: CREATE CAPACITY UTILIZATION VIEW
-- ==============================================================================

-- Create view for easy capacity monitoring and reporting
CREATE OR REPLACE VIEW roster_capacity_status AS
SELECT 
    sr.id,
    sr.roster_name,
    sr.max_capacity,
    COALESCE(sr.current_enrollment, 0) as current_enrollment,
    CASE 
        WHEN sr.max_capacity IS NULL THEN NULL
        ELSE sr.max_capacity - COALESCE(sr.current_enrollment, 0)
    END as available_spots,
    CASE 
        WHEN sr.max_capacity IS NULL THEN 'UNLIMITED'
        WHEN COALESCE(sr.current_enrollment, 0) = 0 THEN 'EMPTY'
        WHEN COALESCE(sr.current_enrollment, 0) >= sr.max_capacity THEN 'FULL'
        WHEN COALESCE(sr.current_enrollment, 0) >= (sr.max_capacity * 0.8) THEN 'NEARLY_FULL'
        ELSE 'AVAILABLE'
    END as capacity_status,
    CASE 
        WHEN sr.max_capacity IS NULL OR sr.max_capacity = 0 THEN NULL
        ELSE ROUND((COALESCE(sr.current_enrollment, 0)::DECIMAL / sr.max_capacity) * 100, 2)
    END as utilization_percentage,
    sr.created_at,
    sr.updated_at
FROM student_rosters sr
WHERE sr.status IS NULL OR sr.status != 'DELETED';

-- Add helpful comment for view documentation
COMMENT ON VIEW roster_capacity_status IS 
'Provides comprehensive capacity utilization information for all active rosters';

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS (for manual rollback if needed)
-- ==============================================================================

/*
-- ROLLBACK SCRIPT (uncomment and run if rollback is needed):

-- 1. Drop the enhanced trigger and function
DROP TRIGGER IF EXISTS update_roster_enrollment_count ON student_roster_members;
DROP FUNCTION IF EXISTS update_roster_enrollment_count();

-- 2. Remove constraints
ALTER TABLE student_rosters DROP CONSTRAINT IF EXISTS check_enrollment_capacity;
ALTER TABLE student_rosters DROP CONSTRAINT IF EXISTS check_enrollment_non_negative;
ALTER TABLE student_rosters DROP CONSTRAINT IF EXISTS check_max_capacity_positive;

-- 3. Drop indexes
DROP INDEX IF EXISTS idx_student_rosters_capacity_availability;
DROP INDEX IF EXISTS idx_student_rosters_enrollment_status;
DROP INDEX IF EXISTS idx_student_roster_members_roster_student;
DROP INDEX IF EXISTS idx_student_roster_members_student_created;
DROP INDEX IF EXISTS idx_student_roster_members_roster_created;

-- 4. Drop helper function and view
DROP FUNCTION IF EXISTS check_roster_capacity(UUID, INTEGER);
DROP VIEW IF EXISTS roster_capacity_status;

-- 5. Recreate original simple trigger if it existed
CREATE OR REPLACE FUNCTION update_roster_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment + 1 
        WHERE id = NEW.roster_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE student_rosters 
        SET current_enrollment = current_enrollment - 1 
        WHERE id = OLD.roster_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roster_enrollment_count
    AFTER INSERT OR DELETE ON student_roster_members
    FOR EACH ROW EXECUTE FUNCTION update_roster_enrollment_count();
*/

-- ==============================================================================
-- MIGRATION COMPLETION SUMMARY
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Roster Capacity Management Migration Complete';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE '✅ Enhanced trigger function with capacity validation';
    RAISE NOTICE '✅ Added database constraints for capacity enforcement';
    RAISE NOTICE '✅ Created performance indexes for enrollment queries';
    RAISE NOTICE '✅ Added helper function for capacity checking';
    RAISE NOTICE '✅ Created capacity utilization monitoring view';
    RAISE NOTICE '✅ Comprehensive error handling and logging';
    RAISE NOTICE '✅ Rollback instructions included in migration file';
    RAISE NOTICE '';
    RAISE NOTICE 'Key Features:';
    RAISE NOTICE '- Automatic enrollment count maintenance';
    RAISE NOTICE '- Capacity validation prevents over-enrollment';
    RAISE NOTICE '- Performance optimized with targeted indexes';
    RAISE NOTICE '- Comprehensive audit logging and error messages';
    RAISE NOTICE '- Real-time capacity monitoring via roster_capacity_status view';
    RAISE NOTICE '- Helper function check_roster_capacity() for programmatic validation';
    RAISE NOTICE '';
    RAISE NOTICE 'System is now ready for robust enrollment capacity management!';
    RAISE NOTICE '=============================================================';
END;
$$;