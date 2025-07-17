-- =====================================================================================
-- MULTI-COURSE TRAINING SESSIONS HELPER FUNCTIONS MIGRATION
-- File: 20250717_add_multicourse_helper_functions.sql
-- Description: Database functions for multi-course training session management
-- =====================================================================================

-- =====================================================================================
-- FUNCTION: create_session_from_template
-- Description: Creates a new training session from a session template
-- =====================================================================================
CREATE OR REPLACE FUNCTION create_session_from_template(
    p_template_id UUID,
    p_session_date DATE,
    p_start_time TIME,
    p_location_id UUID,
    p_instructor_id UUID,
    p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_session_id UUID;
    v_template_record RECORD;
    v_component_record RECORD;
    v_session_code VARCHAR(100);
    v_end_time TIME;
BEGIN
    -- Get template details
    SELECT * INTO v_template_record 
    FROM training_session_templates 
    WHERE id = p_template_id AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found or inactive: %', p_template_id;
    END IF;
    
    -- Calculate end time
    v_end_time := p_start_time + (v_template_record.total_duration_minutes || ' minutes')::INTERVAL;
    
    -- Generate unique session code
    v_session_code := 'SES-' || TO_CHAR(p_session_date, 'YYYYMMDD') || '-' || 
                      SUBSTRING(p_template_id::TEXT, 1, 8);
    
    -- Create the training session
    INSERT INTO training_sessions (
        title,
        description,
        session_date,
        start_time,
        end_time,
        location_id,
        instructor_id,
        max_capacity,
        session_template_id,
        session_code,
        provider_id,
        created_at,
        updated_at
    ) VALUES (
        v_template_record.name,
        v_template_record.description,
        p_session_date,
        p_start_time,
        v_end_time,
        p_location_id,
        p_instructor_id,
        v_template_record.max_participants,
        p_template_id,
        v_session_code,
        v_template_record.provider_id,
        NOW(),
        NOW()
    ) RETURNING id INTO v_session_id;
    
    RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: validate_course_prerequisites
-- Description: Validates if a student has completed all prerequisites for a course
-- =====================================================================================
CREATE OR REPLACE FUNCTION validate_course_prerequisites(
    p_student_id UUID,
    p_course_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_prerequisite_record RECORD;
    v_completion_count INTEGER;
BEGIN
    -- Check each prerequisite
    FOR v_prerequisite_record IN 
        SELECT * FROM course_prerequisites 
        WHERE course_id = p_course_id AND is_active = true
    LOOP
        -- Count completed prerequisites for this student
        SELECT COUNT(*) INTO v_completion_count
        FROM session_enrollments se
        JOIN training_sessions ts ON se.session_id = ts.id
        WHERE se.student_id = p_student_id
        AND ts.course_template = v_prerequisite_record.prerequisite_course_id::TEXT
        AND se.completion_status = 'COMPLETED';
        
        -- If prerequisite not met
        IF v_completion_count = 0 THEN
            RETURN FALSE;
        END IF;
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: enroll_student_in_session
-- Description: Enrolls a student in a training session with prerequisite validation
-- =====================================================================================
CREATE OR REPLACE FUNCTION enroll_student_in_session(
    p_session_id UUID,
    p_student_id UUID,
    p_skip_prerequisite_check BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    v_enrollment_id UUID;
    v_session_record RECORD;
    v_current_enrollment INTEGER;
    v_prerequisites_met BOOLEAN;
BEGIN
    -- Get session details
    SELECT * INTO v_session_record 
    FROM training_sessions 
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Training session not found: %', p_session_id;
    END IF;
    
    -- Check capacity
    IF v_session_record.current_enrollment >= v_session_record.max_capacity THEN
        RAISE EXCEPTION 'Session is at full capacity';
    END IF;
    
    -- Check prerequisites if not skipped
    IF NOT p_skip_prerequisite_check AND v_session_record.course_template IS NOT NULL THEN
        SELECT validate_course_prerequisites(p_student_id, v_session_record.course_template::UUID) 
        INTO v_prerequisites_met;
        
        IF NOT v_prerequisites_met THEN
            RAISE EXCEPTION 'Student does not meet course prerequisites';
        END IF;
    END IF;
    
    -- Create enrollment
    INSERT INTO session_enrollments (
        session_id,
        student_id,
        enrollment_date,
        attendance_status,
        completion_status,
        created_at,
        updated_at
    ) VALUES (
        p_session_id,
        p_student_id,
        NOW(),
        'REGISTERED',
        'NOT_STARTED',
        NOW(),
        NOW()
    ) RETURNING id INTO v_enrollment_id;
    
    -- Update session enrollment count
    UPDATE training_sessions 
    SET current_enrollment = current_enrollment + 1,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN v_enrollment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: initialize_component_progress
-- Description: Initializes progress tracking for all template components for an enrollment
-- =====================================================================================
CREATE OR REPLACE FUNCTION initialize_component_progress(
    p_enrollment_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_session_id UUID;
    v_template_id UUID;
    v_component_record RECORD;
    v_progress_count INTEGER := 0;
BEGIN
    -- Get session and template info
    SELECT se.session_id, ts.session_template_id 
    INTO v_session_id, v_template_id
    FROM session_enrollments se
    JOIN training_sessions ts ON se.session_id = ts.id
    WHERE se.id = p_enrollment_id;
    
    IF v_template_id IS NULL THEN
        RETURN 0; -- No template components to initialize
    END IF;
    
    -- Create progress records for each template component
    FOR v_component_record IN 
        SELECT * FROM session_template_components 
        WHERE session_template_id = v_template_id
        ORDER BY sequence_order
    LOOP
        INSERT INTO session_component_progress (
            session_enrollment_id,
            session_template_component_id,
            status,
            attempts,
            max_attempts,
            attendance_status,
            created_at,
            updated_at
        ) VALUES (
            p_enrollment_id,
            v_component_record.id,
            'NOT_STARTED',
            0,
            v_component_record.max_attempts,
            'REGISTERED',
            NOW(),
            NOW()
        );
        
        v_progress_count := v_progress_count + 1;
    END LOOP;
    
    RETURN v_progress_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: calculate_session_completion_rate
-- Description: Calculates completion rate for a training session
-- =====================================================================================
CREATE OR REPLACE FUNCTION calculate_session_completion_rate(
    p_session_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_enrolled INTEGER;
    v_completed_count INTEGER;
    v_completion_rate DECIMAL(5,2);
BEGIN
    -- Get total enrolled students
    SELECT COUNT(*) INTO v_total_enrolled
    FROM session_enrollments
    WHERE session_id = p_session_id;
    
    IF v_total_enrolled = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Get completed students
    SELECT COUNT(*) INTO v_completed_count
    FROM session_enrollments
    WHERE session_id = p_session_id
    AND completion_status = 'COMPLETED';
    
    -- Calculate completion rate
    v_completion_rate := (v_completed_count::DECIMAL / v_total_enrolled::DECIMAL) * 100;
    
    -- Update session record
    UPDATE training_sessions 
    SET completion_rate = v_completion_rate,
        updated_at = NOW()
    WHERE id = p_session_id;
    
    RETURN v_completion_rate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: calculate_student_component_progress
-- Description: Calculates overall progress percentage for a student's session enrollment
-- =====================================================================================
CREATE OR REPLACE FUNCTION calculate_student_component_progress(
    p_enrollment_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_components INTEGER;
    v_completed_components INTEGER;
    v_progress_percentage DECIMAL(5,2);
BEGIN
    -- Get total components for this enrollment
    SELECT COUNT(*) INTO v_total_components
    FROM session_component_progress
    WHERE session_enrollment_id = p_enrollment_id;
    
    IF v_total_components = 0 THEN
        RETURN 0.00;
    END IF;
    
    -- Get completed components
    SELECT COUNT(*) INTO v_completed_components
    FROM session_component_progress
    WHERE session_enrollment_id = p_enrollment_id
    AND status IN ('COMPLETED', 'PASSED');
    
    -- Calculate progress percentage
    v_progress_percentage := (v_completed_components::DECIMAL / v_total_components::DECIMAL) * 100;
    
    RETURN v_progress_percentage;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: update_component_progress
-- Description: Updates progress for a specific session component
-- =====================================================================================
CREATE OR REPLACE FUNCTION update_component_progress(
    p_progress_id UUID,
    p_status VARCHAR(50),
    p_score DECIMAL(5,2) DEFAULT NULL,
    p_attendance_status VARCHAR(50) DEFAULT NULL,
    p_instructor_notes TEXT DEFAULT NULL,
    p_completed_by UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_component_record RECORD;
    v_min_score_required DECIMAL(5,2);
    v_passed BOOLEAN := NULL;
BEGIN
    -- Get component progress and template info
    SELECT scp.*, stc.min_score_required, stc.has_assessment
    INTO v_component_record
    FROM session_component_progress scp
    JOIN session_template_components stc ON scp.session_template_component_id = stc.id
    WHERE scp.id = p_progress_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Component progress record not found: %', p_progress_id;
    END IF;
    
    -- Determine if passed based on score and requirements
    IF p_score IS NOT NULL AND v_component_record.has_assessment THEN
        v_min_score_required := COALESCE(v_component_record.min_score_required, 70.00);
        v_passed := p_score >= v_min_score_required;
    END IF;
    
    -- Update the progress record
    UPDATE session_component_progress SET
        status = COALESCE(p_status, status),
        score = COALESCE(p_score, score),
        passed = COALESCE(v_passed, passed),
        attendance_status = COALESCE(p_attendance_status, attendance_status),
        instructor_notes = COALESCE(p_instructor_notes, instructor_notes),
        completed_by = COALESCE(p_completed_by, completed_by),
        end_time = CASE WHEN p_status IN ('COMPLETED', 'PASSED', 'FAILED') THEN NOW() ELSE end_time END,
        updated_at = NOW()
    WHERE id = p_progress_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: get_session_template_summary
-- Description: Gets summary information about a session template
-- =====================================================================================
CREATE OR REPLACE FUNCTION get_session_template_summary(
    p_template_id UUID
) RETURNS TABLE (
    template_name VARCHAR(255),
    total_duration_minutes INTEGER,
    component_count INTEGER,
    break_count INTEGER,
    assessment_count INTEGER,
    required_instructors INTEGER,
    max_participants INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tst.name,
        tst.total_duration_minutes,
        COUNT(stc.id)::INTEGER as component_count,
        COUNT(CASE WHEN stc.is_break = true THEN 1 END)::INTEGER as break_count,
        COUNT(CASE WHEN stc.has_assessment = true THEN 1 END)::INTEGER as assessment_count,
        tst.required_instructors,
        tst.max_participants
    FROM training_session_templates tst
    LEFT JOIN session_template_components stc ON tst.id = stc.session_template_id
    WHERE tst.id = p_template_id
    GROUP BY tst.id, tst.name, tst.total_duration_minutes, tst.required_instructors, tst.max_participants;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- FUNCTION: get_student_session_progress
-- Description: Gets detailed progress information for a student's session enrollment
-- =====================================================================================
CREATE OR REPLACE FUNCTION get_student_session_progress(
    p_enrollment_id UUID
) RETURNS TABLE (
    component_name VARCHAR(255),
    component_type VARCHAR(50),
    sequence_order INTEGER,
    status VARCHAR(50),
    score DECIMAL(5,2),
    passed BOOLEAN,
    attendance_status VARCHAR(50),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        stc.component_name,
        stc.component_type,
        stc.sequence_order,
        scp.status,
        scp.score,
        scp.passed,
        scp.attendance_status,
        scp.start_time,
        scp.end_time,
        stc.duration_minutes
    FROM session_component_progress scp
    JOIN session_template_components stc ON scp.session_template_component_id = stc.id
    WHERE scp.session_enrollment_id = p_enrollment_id
    ORDER BY stc.sequence_order;
END;
$$ LANGUAGE plpgsql SECURITY_DEFINER;

-- =====================================================================================
-- FUNCTION: validate_session_template
-- Description: Validates a session template for consistency and completeness
-- =====================================================================================
CREATE OR REPLACE FUNCTION validate_session_template(
    p_template_id UUID
) RETURNS TABLE (
    is_valid BOOLEAN,
    error_count INTEGER,
    validation_errors TEXT[]
) AS $$
DECLARE
    v_errors TEXT[] := '{}';
    v_template_record RECORD;
    v_total_component_duration INTEGER;
    v_component_count INTEGER;
BEGIN
    -- Get template
    SELECT * INTO v_template_record 
    FROM training_session_templates 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
        v_errors := array_append(v_errors, 'Template not found');
        RETURN QUERY SELECT false, array_length(v_errors, 1), v_errors;
        RETURN;
    END IF;
    
    -- Check if template has components
    SELECT COUNT(*), COALESCE(SUM(duration_minutes), 0) 
    INTO v_component_count, v_total_component_duration
    FROM session_template_components 
    WHERE session_template_id = p_template_id;
    
    IF v_component_count = 0 THEN
        v_errors := array_append(v_errors, 'Template has no components');
    END IF;
    
    -- Check duration consistency
    IF v_total_component_duration != v_template_record.total_duration_minutes THEN
        v_errors := array_append(v_errors, 
            'Total component duration (' || v_total_component_duration || 
            ') does not match template duration (' || v_template_record.total_duration_minutes || ')');
    END IF;
    
    -- Check for sequence gaps
    IF EXISTS (
        SELECT 1 FROM (
            SELECT sequence_order, 
                   sequence_order - LAG(sequence_order, 1, 0) OVER (ORDER BY sequence_order) as gap
            FROM session_template_components 
            WHERE session_template_id = p_template_id
        ) t WHERE gap > 1
    ) THEN
        v_errors := array_append(v_errors, 'Components have sequence order gaps');
    END IF;
    
    RETURN QUERY SELECT 
        array_length(v_errors, 1) = 0 OR v_errors = '{}',
        COALESCE(array_length(v_errors, 1), 0),
        v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================================================
-- TRIGGER FUNCTIONS
-- =====================================================================================

-- Automatically initialize component progress when student enrolls
CREATE OR REPLACE FUNCTION trigger_initialize_component_progress()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM initialize_component_progress(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS auto_initialize_component_progress ON session_enrollments;
CREATE TRIGGER auto_initialize_component_progress
    AFTER INSERT ON session_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_initialize_component_progress();

-- =====================================================================================
-- GRANT PERMISSIONS
-- =====================================================================================

-- Grant execute permissions to appropriate roles
GRANT EXECUTE ON FUNCTION create_session_from_template TO authenticated;
GRANT EXECUTE ON FUNCTION validate_course_prerequisites TO authenticated;
GRANT EXECUTE ON FUNCTION enroll_student_in_session TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_component_progress TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_session_completion_rate TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_student_component_progress TO authenticated;
GRANT EXECUTE ON FUNCTION update_component_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_template_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_session_progress TO authenticated;
GRANT EXECUTE ON FUNCTION validate_session_template TO authenticated;

-- =====================================================================================
-- MIGRATION COMPLETION LOG
-- =====================================================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MULTI-COURSE HELPER FUNCTIONS MIGRATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Created functions:';
    RAISE NOTICE '✓ create_session_from_template - Create sessions from templates';
    RAISE NOTICE '✓ validate_course_prerequisites - Check student prerequisites';
    RAISE NOTICE '✓ enroll_student_in_session - Enroll students with validation';
    RAISE NOTICE '✓ initialize_component_progress - Set up progress tracking';
    RAISE NOTICE '✓ calculate_session_completion_rate - Session metrics';
    RAISE NOTICE '✓ calculate_student_component_progress - Student progress';
    RAISE NOTICE '✓ update_component_progress - Update progress records';
    RAISE NOTICE '✓ get_session_template_summary - Template information';
    RAISE NOTICE '✓ get_student_session_progress - Detailed progress view';
    RAISE NOTICE '✓ validate_session_template - Template validation';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Triggers created:';
    RAISE NOTICE '✓ auto_initialize_component_progress - Auto-setup progress tracking';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'All functions granted to authenticated users';
    RAISE NOTICE '==========================================';
END $$;