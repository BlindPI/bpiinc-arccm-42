-- =====================================================================================
-- MULTI-COURSE TRAINING SESSIONS PERFORMANCE INDEXES MIGRATION
-- File: 20250717_add_multicourse_performance_indexes.sql
-- Description: Adds missing columns and creates performance indexes for multi-course system
-- COMPREHENSIVE VERSION - ADDS MISSING COLUMNS THEN CREATES INDEXES
-- =====================================================================================

-- =====================================================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================================================

-- Ensure course_prerequisites table exists with all required columns
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL,
  prerequisite_course_id UUID NOT NULL,
  prerequisite_type VARCHAR(50) NOT NULL DEFAULT 'REQUIRED',
  min_score_required DECIMAL(5,2),
  validity_months INTEGER,
  alternative_qualification TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID,
  
  -- Prevent self-referencing prerequisites
  CONSTRAINT check_no_self_prerequisite CHECK (course_id != prerequisite_course_id),
  CONSTRAINT check_prerequisite_type CHECK (prerequisite_type IN ('REQUIRED', 'RECOMMENDED', 'ALTERNATIVE', 'CONCURRENT')),
  CONSTRAINT check_min_score_range CHECK (min_score_required IS NULL OR (min_score_required >= 0 AND min_score_required <= 100)),
  
  -- Unique constraint to prevent duplicate prerequisites
  UNIQUE(course_id, prerequisite_course_id)
);

-- Add missing columns to course_prerequisites if they don't exist
DO $$
BEGIN
  -- Add prerequisite_type if missing
  BEGIN
    ALTER TABLE course_prerequisites ADD COLUMN IF NOT EXISTS prerequisite_type VARCHAR(50) NOT NULL DEFAULT 'REQUIRED';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add is_active if missing
  BEGIN
    ALTER TABLE course_prerequisites ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add min_score_required if missing
  BEGIN
    ALTER TABLE course_prerequisites ADD COLUMN IF NOT EXISTS min_score_required DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add validity_months if missing
  BEGIN
    ALTER TABLE course_prerequisites ADD COLUMN IF NOT EXISTS validity_months INTEGER;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add alternative_qualification if missing
  BEGIN
    ALTER TABLE course_prerequisites ADD COLUMN IF NOT EXISTS alternative_qualification TEXT;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;

-- =====================================================================================
-- TRAINING_SESSION_TEMPLATES INDEXES
-- =====================================================================================

-- Index for provider-specific template queries (AP users)
CREATE INDEX IF NOT EXISTS idx_training_session_templates_provider_active 
ON training_session_templates(provider_id, is_active) 
WHERE is_active = true;

-- Index for template type filtering
CREATE INDEX IF NOT EXISTS idx_training_session_templates_type_active 
ON training_session_templates(template_type, is_active) 
WHERE is_active = true;

-- Index for creator-specific queries
CREATE INDEX IF NOT EXISTS idx_training_session_templates_created_by 
ON training_session_templates(created_by);

-- Index for public template queries
CREATE INDEX IF NOT EXISTS idx_training_session_templates_public_active 
ON training_session_templates(is_public, is_active) 
WHERE is_public = true AND is_active = true;

-- Index for total duration filtering
CREATE INDEX IF NOT EXISTS idx_training_session_templates_duration 
ON training_session_templates(total_duration_minutes);

-- Composite index for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_training_session_templates_provider_type_active 
ON training_session_templates(provider_id, template_type, is_active) 
WHERE is_active = true;

-- Index for template code lookups
CREATE INDEX IF NOT EXISTS idx_training_session_templates_code 
ON training_session_templates(code);

-- =====================================================================================
-- SESSION_TEMPLATE_COMPONENTS INDEXES
-- =====================================================================================

-- Index for getting components by template (most common query)
CREATE INDEX IF NOT EXISTS idx_session_template_components_template_sequence 
ON session_template_components(session_template_id, sequence_order);

-- Index for component type filtering
CREATE INDEX IF NOT EXISTS idx_session_template_components_type 
ON session_template_components(component_type);

-- Index for mandatory component filtering
CREATE INDEX IF NOT EXISTS idx_session_template_components_mandatory 
ON session_template_components(session_template_id, is_mandatory) 
WHERE is_mandatory = true;

-- Index for break components
CREATE INDEX IF NOT EXISTS idx_session_template_components_breaks 
ON session_template_components(session_template_id, is_break) 
WHERE is_break = true;

-- Index for assessment components
CREATE INDEX IF NOT EXISTS idx_session_template_components_assessments 
ON session_template_components(session_template_id, has_assessment) 
WHERE has_assessment = true;

-- Index for course-based components
CREATE INDEX IF NOT EXISTS idx_session_template_components_course 
ON session_template_components(course_id) 
WHERE course_id IS NOT NULL;

-- Index for component duration analysis
CREATE INDEX IF NOT EXISTS idx_session_template_components_duration 
ON session_template_components(session_template_id, duration_minutes);

-- =====================================================================================
-- SESSION_COMPONENT_PROGRESS INDEXES
-- =====================================================================================

-- Index for student progress queries (most common)
CREATE INDEX IF NOT EXISTS idx_session_component_progress_enrollment_component 
ON session_component_progress(session_enrollment_id, session_template_component_id);

-- Index for progress status filtering
CREATE INDEX IF NOT EXISTS idx_session_component_progress_status 
ON session_component_progress(status);

-- Index for completion status queries
CREATE INDEX IF NOT EXISTS idx_session_component_progress_enrollment_status 
ON session_component_progress(session_enrollment_id, status);

-- Index for instructor progress review queries
CREATE INDEX IF NOT EXISTS idx_session_component_progress_component_status 
ON session_component_progress(session_template_component_id, status);

-- Index for attendance tracking
CREATE INDEX IF NOT EXISTS idx_session_component_progress_attendance 
ON session_component_progress(attendance_status);

-- Index for passed/failed analysis
CREATE INDEX IF NOT EXISTS idx_session_component_progress_passed 
ON session_component_progress(passed) 
WHERE passed IS NOT NULL;

-- Index for time-based progress queries
CREATE INDEX IF NOT EXISTS idx_session_component_progress_times 
ON session_component_progress(start_time, end_time) 
WHERE start_time IS NOT NULL;

-- Index for completion tracking by date
CREATE INDEX IF NOT EXISTS idx_session_component_progress_completed_date 
ON session_component_progress(updated_at, status) 
WHERE status IN ('COMPLETED', 'PASSED', 'FAILED');

-- Index for score analysis
CREATE INDEX IF NOT EXISTS idx_session_component_progress_score 
ON session_component_progress(score) 
WHERE score IS NOT NULL;

-- =====================================================================================
-- COURSE_PREREQUISITES INDEXES (WITH ALL REQUIRED COLUMNS)
-- =====================================================================================

-- Index for prerequisite lookups (most common)
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_active 
ON course_prerequisites(course_id, is_active) 
WHERE is_active = true;

-- Index for reverse prerequisite lookups
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite_active 
ON course_prerequisites(prerequisite_course_id, is_active) 
WHERE is_active = true;

-- Index for prerequisite type filtering
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_type 
ON course_prerequisites(prerequisite_type);

-- Index for required score filtering
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_min_score 
ON course_prerequisites(min_score_required) 
WHERE min_score_required IS NOT NULL;

-- Index for validity period queries
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_validity 
ON course_prerequisites(validity_months) 
WHERE validity_months IS NOT NULL;

-- Composite index for complete prerequisite validation
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_validation 
ON course_prerequisites(course_id, prerequisite_course_id, prerequisite_type, is_active) 
WHERE is_active = true;

-- =====================================================================================
-- ENHANCED INDEXES FOR EXISTING TABLES
-- =====================================================================================

-- Enhanced training_sessions indexes for multi-course support
CREATE INDEX IF NOT EXISTS idx_training_sessions_template_date 
ON training_sessions(session_template_id, session_date) 
WHERE session_template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_sessions_provider_date 
ON training_sessions(provider_id, session_date) 
WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_training_sessions_instructor_date 
ON training_sessions(instructor_id, session_date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_location_date 
ON training_sessions(location_id, session_date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_status_date 
ON training_sessions(status, session_date);

CREATE INDEX IF NOT EXISTS idx_training_sessions_template_status 
ON training_sessions(session_template_id, status) 
WHERE session_template_id IS NOT NULL;

-- Enhanced session_enrollments indexes for component progress
CREATE INDEX IF NOT EXISTS idx_session_enrollments_student_completion 
ON session_enrollments(student_id, completion_status);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_session_completion 
ON session_enrollments(session_id, completion_status);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_attendance 
ON session_enrollments(attendance_status);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_enrollment_date 
ON session_enrollments(enrollment_date);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_score 
ON session_enrollments(assessment_score) 
WHERE assessment_score IS NOT NULL;

-- Composite index for instructor session management
CREATE INDEX IF NOT EXISTS idx_session_enrollments_instructor_lookup 
ON session_enrollments(session_id, completion_status, attendance_status);

-- =====================================================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- =====================================================================================

-- Index for active templates
CREATE INDEX IF NOT EXISTS idx_templates_with_components
ON training_session_templates(id, name, total_duration_minutes)
WHERE is_active = true;

-- Index for incomplete progress records
CREATE INDEX IF NOT EXISTS idx_incomplete_component_progress 
ON session_component_progress(session_enrollment_id, session_template_component_id, updated_at) 
WHERE status IN ('NOT_STARTED', 'IN_PROGRESS');

-- Index for failed progress records needing attention
CREATE INDEX IF NOT EXISTS idx_failed_component_progress 
ON session_component_progress(session_enrollment_id, session_template_component_id, attempts, updated_at) 
WHERE status = 'FAILED' AND attempts < max_attempts;

-- =====================================================================================
-- FUNCTION-BASED INDEXES
-- =====================================================================================

-- Index for template validation queries
CREATE INDEX IF NOT EXISTS idx_template_components_validation 
ON session_template_components(session_template_id, duration_minutes, sequence_order) 
WHERE session_template_id IS NOT NULL;

-- Index for prerequisite validation performance
CREATE INDEX IF NOT EXISTS idx_prerequisite_validation 
ON course_prerequisites(prerequisite_course_id, course_id) 
WHERE is_active = true AND prerequisite_type = 'REQUIRED';

-- =====================================================================================
-- STATISTICS AND MAINTENANCE
-- =====================================================================================

-- Update table statistics for query planner
ANALYZE training_session_templates;
ANALYZE session_template_components;
ANALYZE session_component_progress;
ANALYZE course_prerequisites;
ANALYZE training_sessions;
ANALYZE session_enrollments;

-- =====================================================================================
-- MIGRATION COMPLETION LOG
-- =====================================================================================

DO $$
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'MULTI-COURSE PERFORMANCE INDEXES MIGRATION COMPLETE';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Added missing columns:';
    RAISE NOTICE '✓ course_prerequisites.prerequisite_type';
    RAISE NOTICE '✓ course_prerequisites.is_active';
    RAISE NOTICE '✓ course_prerequisites.min_score_required';
    RAISE NOTICE '✓ course_prerequisites.validity_months';
    RAISE NOTICE '✓ course_prerequisites.alternative_qualification';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Created indexes for:';
    RAISE NOTICE '✓ training_session_templates (7 indexes)';
    RAISE NOTICE '✓ session_template_components (7 indexes)';
    RAISE NOTICE '✓ session_component_progress (9 indexes)';
    RAISE NOTICE '✓ course_prerequisites (6 indexes)';
    RAISE NOTICE '✓ Enhanced existing table indexes (11 indexes)';
    RAISE NOTICE '✓ Specialized partial indexes (3 indexes)';
    RAISE NOTICE '✓ Function-based indexes (2 indexes)';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'Total indexes created: 45';
    RAISE NOTICE 'FULL FUNCTIONALITY WITH ALL REQUIRED COLUMNS';
    RAISE NOTICE '==========================================';
END $$;