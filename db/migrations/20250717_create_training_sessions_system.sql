-- Multi-Course Training Sessions System
-- This migration creates a comprehensive system for managing training sessions
-- that can include multiple courses, breaks, and activities in a single itinerary
-- This complements the existing `courses` table used for certificate matching

-- Create training_session_templates table for reusable multi-course itineraries
CREATE TABLE IF NOT EXISTS training_session_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  template_type VARCHAR(50) NOT NULL DEFAULT 'MULTI_COURSE',
  
  -- Duration and timing
  total_duration_minutes INTEGER NOT NULL,
  estimated_break_minutes INTEGER DEFAULT 0,
  max_participants INTEGER,
  
  -- Template configuration
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  requires_approval BOOLEAN DEFAULT false,
  
  -- Resource requirements
  required_instructors INTEGER DEFAULT 1,
  required_rooms INTEGER DEFAULT 1,
  required_equipment TEXT[],
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  provider_id UUID,
  
  CONSTRAINT check_total_duration_positive CHECK (total_duration_minutes > 0),
  CONSTRAINT check_template_type CHECK (template_type IN ('SINGLE_COURSE', 'MULTI_COURSE', 'WORKSHOP_SERIES', 'CERTIFICATION_TRACK'))
);

-- Create session_template_components table for individual components in session templates
CREATE TABLE IF NOT EXISTS session_template_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_template_id UUID NOT NULL REFERENCES training_session_templates(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  
  -- Component configuration
  component_type VARCHAR(50) NOT NULL DEFAULT 'COURSE',
  sequence_order INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  component_name VARCHAR(255),
  component_description TEXT,
  
  -- Timing and scheduling
  is_break BOOLEAN DEFAULT false,
  break_type VARCHAR(50),
  is_mandatory BOOLEAN DEFAULT true,
  allows_parallel BOOLEAN DEFAULT false,
  
  -- Resource allocation
  instructor_required BOOLEAN DEFAULT true,
  room_required BOOLEAN DEFAULT true,
  equipment_required TEXT[],
  max_participants INTEGER,
  
  -- Assessment configuration
  has_assessment BOOLEAN DEFAULT false,
  assessment_type VARCHAR(50),
  min_score_required DECIMAL(5,2),
  
  -- Component metadata
  notes TEXT,
  special_requirements TEXT[],
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT check_sequence_order_positive CHECK (sequence_order > 0),
  CONSTRAINT check_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT check_component_type CHECK (component_type IN ('COURSE', 'BREAK', 'ASSESSMENT', 'ACTIVITY', 'DISCUSSION', 'PRACTICAL', 'LUNCH')),
  CONSTRAINT check_break_type CHECK (break_type IS NULL OR break_type IN ('SHORT', 'LUNCH', 'EXTENDED', 'TRANSITION')),
  CONSTRAINT check_assessment_type CHECK (assessment_type IS NULL OR assessment_type IN ('WRITTEN', 'PRACTICAL', 'BOTH', 'OBSERVATION')),
  CONSTRAINT check_min_score_range CHECK (min_score_required IS NULL OR (min_score_required >= 0 AND min_score_required <= 100)),
  
  -- Unique constraint for sequence order within template
  UNIQUE(session_template_id, sequence_order)
);

-- Create training_sessions table for actual scheduled session instances
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_template_id UUID REFERENCES training_session_templates(id),
  name VARCHAR(255) NOT NULL,
  session_code VARCHAR(100) UNIQUE,
  description TEXT,
  
  -- Scheduling information
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  time_zone VARCHAR(50) DEFAULT 'America/Toronto',
  
  -- Session status and management
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
  registration_status VARCHAR(50) NOT NULL DEFAULT 'CLOSED',
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  waitlist_enabled BOOLEAN DEFAULT false,
  
  -- Location and resources
  location_id UUID,
  room_assignments JSONB,
  instructor_assignments JSONB,
  equipment_assignments JSONB,
  
  -- Pricing and business
  base_price DECIMAL(10,2),
  early_bird_price DECIMAL(10,2),
  early_bird_deadline DATE,
  group_discount_percentage DECIMAL(5,2),
  
  -- Session completion tracking
  completion_rate DECIMAL(5,2),
  average_score DECIMAL(5,2),
  completion_date TIMESTAMP WITH TIME ZONE,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  provider_id UUID,
  
  CONSTRAINT check_session_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  CONSTRAINT check_registration_status CHECK (registration_status IN ('OPEN', 'CLOSED', 'WAITLIST_ONLY', 'INVITATION_ONLY')),
  CONSTRAINT check_max_participants_positive CHECK (max_participants > 0),
  CONSTRAINT check_current_participants_range CHECK (current_participants >= 0 AND current_participants <= max_participants),
  CONSTRAINT check_time_order CHECK (end_time > start_time),
  CONSTRAINT check_completion_rate_range CHECK (completion_rate IS NULL OR (completion_rate >= 0 AND completion_rate <= 100)),
  CONSTRAINT check_average_score_range CHECK (average_score IS NULL OR (average_score >= 0 AND average_score <= 100))
);

-- Create session_enrollments table for participant enrollment tracking
CREATE TABLE IF NOT EXISTS session_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Enrollment information
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  enrollment_status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  amount_paid DECIMAL(10,2),
  
  -- Session progress tracking
  overall_status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  overall_score DECIMAL(5,2),
  overall_passed BOOLEAN,
  
  -- Attendance and participation
  attendance_status VARCHAR(50) DEFAULT 'REGISTERED',
  attendance_percentage DECIMAL(5,2),
  participation_score DECIMAL(5,2),
  
  -- Notes and feedback
  instructor_notes TEXT,
  participant_feedback TEXT,
  completion_notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT check_enrollment_status CHECK (enrollment_status IN ('REGISTERED', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'NO_SHOW', 'COMPLETED')),
  CONSTRAINT check_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'REFUNDED', 'WAIVED')),
  CONSTRAINT check_overall_status CHECK (overall_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PASSED', 'FAILED', 'WITHDRAWN')),
  CONSTRAINT check_overall_score_range CHECK (overall_score IS NULL OR (overall_score >= 0 AND overall_score <= 100)),
  CONSTRAINT check_attendance_status CHECK (attendance_status IN ('REGISTERED', 'PRESENT', 'ABSENT', 'LATE', 'EARLY_DEPARTURE', 'EXCUSED')),
  CONSTRAINT check_attendance_percentage_range CHECK (attendance_percentage IS NULL OR (attendance_percentage >= 0 AND attendance_percentage <= 100)),
  CONSTRAINT check_participation_score_range CHECK (participation_score IS NULL OR (participation_score >= 0 AND participation_score <= 100)),
  CONSTRAINT check_time_order CHECK (completion_time IS NULL OR start_time IS NULL OR completion_time >= start_time),
  
  -- Unique constraint to prevent duplicate enrollments
  UNIQUE(training_session_id, participant_id)
);

-- Create session_component_progress table for tracking progress through individual components
CREATE TABLE IF NOT EXISTS session_component_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_enrollment_id UUID NOT NULL REFERENCES session_enrollments(id) ON DELETE CASCADE,
  session_template_component_id UUID NOT NULL REFERENCES session_template_components(id) ON DELETE CASCADE,
  
  -- Component progress tracking
  status VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_actual_minutes INTEGER,
  
  -- Assessment results
  score DECIMAL(5,2),
  passed BOOLEAN,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  
  -- Attendance and participation
  attendance_status VARCHAR(50) DEFAULT 'REGISTERED',
  attendance_percentage DECIMAL(5,2),
  participation_score DECIMAL(5,2),
  
  -- Notes and feedback
  instructor_notes TEXT,
  participant_feedback TEXT,
  completion_notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT check_component_status CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PASSED', 'FAILED', 'SKIPPED', 'EXCUSED')),
  CONSTRAINT check_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  CONSTRAINT check_attempts_positive CHECK (attempts >= 0),
  CONSTRAINT check_max_attempts_positive CHECK (max_attempts > 0),
  CONSTRAINT check_attendance_status CHECK (attendance_status IN ('REGISTERED', 'PRESENT', 'ABSENT', 'LATE', 'EARLY_DEPARTURE', 'EXCUSED')),
  CONSTRAINT check_attendance_percentage_range CHECK (attendance_percentage IS NULL OR (attendance_percentage >= 0 AND attendance_percentage <= 100)),
  CONSTRAINT check_participation_score_range CHECK (participation_score IS NULL OR (participation_score >= 0 AND participation_score <= 100)),
  CONSTRAINT check_time_order CHECK (end_time IS NULL OR start_time IS NULL OR end_time >= start_time),
  
  -- Unique constraint to prevent duplicate component progress per enrollment
  UNIQUE(session_enrollment_id, session_template_component_id)
);

-- Create course_prerequisites table for managing dependencies between courses
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_type VARCHAR(50) NOT NULL DEFAULT 'REQUIRED',
  min_score_required DECIMAL(5,2),
  validity_months INTEGER,
  alternative_qualification TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Prevent self-referencing prerequisites
  CONSTRAINT check_no_self_prerequisite CHECK (course_id != prerequisite_course_id),
  CONSTRAINT check_prerequisite_type CHECK (prerequisite_type IN ('REQUIRED', 'RECOMMENDED', 'ALTERNATIVE', 'CONCURRENT')),
  CONSTRAINT check_min_score_range CHECK (min_score_required IS NULL OR (min_score_required >= 0 AND min_score_required <= 100)),
  
  -- Unique constraint to prevent duplicate prerequisites
  UNIQUE(course_id, prerequisite_course_id)
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_training_session_templates_active ON training_session_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_training_session_templates_public ON training_session_templates(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_training_session_templates_provider ON training_session_templates(provider_id);
CREATE INDEX IF NOT EXISTS idx_training_session_templates_type ON training_session_templates(template_type);

CREATE INDEX IF NOT EXISTS idx_session_template_components_template ON session_template_components(session_template_id);
CREATE INDEX IF NOT EXISTS idx_session_template_components_course ON session_template_components(course_id);
CREATE INDEX IF NOT EXISTS idx_session_template_components_sequence ON session_template_components(session_template_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_session_template_components_type ON session_template_components(component_type);

CREATE INDEX IF NOT EXISTS idx_training_sessions_template ON training_sessions(session_template_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_registration ON training_sessions(registration_status);
CREATE INDEX IF NOT EXISTS idx_training_sessions_provider ON training_sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_location ON training_sessions(location_id);

CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(training_session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_participant ON session_enrollments(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_status ON session_enrollments(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_overall_status ON session_enrollments(overall_status);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_attendance ON session_enrollments(attendance_status);

CREATE INDEX IF NOT EXISTS idx_session_component_progress_enrollment ON session_component_progress(session_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_session_component_progress_component ON session_component_progress(session_template_component_id);
CREATE INDEX IF NOT EXISTS idx_session_component_progress_status ON session_component_progress(status);
CREATE INDEX IF NOT EXISTS idx_session_component_progress_attendance ON session_component_progress(attendance_status);

CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course ON course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite ON course_prerequisites(prerequisite_course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_active ON course_prerequisites(is_active) WHERE is_active = true;

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_training_session_templates_updated_at BEFORE UPDATE ON training_session_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_template_components_updated_at BEFORE UPDATE ON session_template_components
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_enrollments_updated_at BEFORE UPDATE ON session_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_component_progress_updated_at BEFORE UPDATE ON session_component_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments for documentation
COMMENT ON TABLE training_session_templates IS 'Reusable templates for multi-course training itineraries';
COMMENT ON TABLE session_template_components IS 'Individual components (courses, breaks, activities) within session templates';
COMMENT ON TABLE training_sessions IS 'Actual instances of multi-course training sessions';
COMMENT ON TABLE session_enrollments IS 'Participant enrollments in training sessions';
COMMENT ON TABLE session_component_progress IS 'Individual participant progress through session components';
COMMENT ON TABLE course_prerequisites IS 'Defines prerequisite relationships between courses';

-- Migration completion notification
DO $$
BEGIN
  RAISE NOTICE 'Multi-Course Training Sessions System Migration Complete:';
  RAISE NOTICE '✅ Created training_session_templates table for reusable itineraries';
  RAISE NOTICE '✅ Created session_template_components table for itinerary components';
  RAISE NOTICE '✅ Created training_sessions table for actual session instances';
  RAISE NOTICE '✅ Created session_enrollments table for participant tracking';
  RAISE NOTICE '✅ Created session_component_progress table for detailed progress tracking';
  RAISE NOTICE '✅ Created course_prerequisites table for dependency management';
  RAISE NOTICE '✅ Added comprehensive indexes for performance optimization';
  RAISE NOTICE '✅ Added update timestamp triggers for audit tracking';
  RAISE NOTICE '✅ Added data validation constraints for data integrity';
  RAISE NOTICE '⚡ Ready for RLS policies and helper functions implementation';
  RAISE NOTICE '';
  RAISE NOTICE 'System supports complex itineraries like:';
  RAISE NOTICE '- CPR A/C/BLS - 2 hr';
  RAISE NOTICE '- 30 Minute Break';
  RAISE NOTICE '- Emergency First Aid Recertification - 2 HR';
  RAISE NOTICE '- Standard First Aid Certification - 2 HR';
END;
$$;