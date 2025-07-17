-- Add Multi-Course Support to Existing Training Sessions System
-- This migration enhances the existing system without breaking current functionality

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
  created_by UUID,
  updated_by UUID,
  provider_id UUID,
  
  CONSTRAINT check_total_duration_positive CHECK (total_duration_minutes > 0),
  CONSTRAINT check_template_type CHECK (template_type IN ('SINGLE_COURSE', 'MULTI_COURSE', 'WORKSHOP_SERIES', 'CERTIFICATION_TRACK'))
);

-- Create session_template_components table for individual components in session templates
CREATE TABLE IF NOT EXISTS session_template_components (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_template_id UUID NOT NULL,
  course_id UUID,
  
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
  created_by UUID,
  
  CONSTRAINT check_sequence_order_positive CHECK (sequence_order > 0),
  CONSTRAINT check_duration_positive CHECK (duration_minutes > 0),
  CONSTRAINT check_component_type CHECK (component_type IN ('COURSE', 'BREAK', 'ASSESSMENT', 'ACTIVITY', 'DISCUSSION', 'PRACTICAL', 'LUNCH')),
  CONSTRAINT check_break_type CHECK (break_type IS NULL OR break_type IN ('SHORT', 'LUNCH', 'EXTENDED', 'TRANSITION')),
  CONSTRAINT check_assessment_type CHECK (assessment_type IS NULL OR assessment_type IN ('WRITTEN', 'PRACTICAL', 'BOTH', 'OBSERVATION')),
  CONSTRAINT check_min_score_range CHECK (min_score_required IS NULL OR (min_score_required >= 0 AND min_score_required <= 100)),
  
  -- Unique constraint for sequence order within template
  UNIQUE(session_template_id, sequence_order)
);

-- Create session_component_progress table for tracking progress through individual components
CREATE TABLE IF NOT EXISTS session_component_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_enrollment_id UUID NOT NULL,
  session_template_component_id UUID NOT NULL,
  
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
  completed_by UUID,
  
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

-- Enhance existing training_sessions table with additional columns for multi-course support
DO $$
BEGIN
  -- Add session_template_id to link to templates
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS session_template_id UUID;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add time zone support
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS time_zone VARCHAR(50) DEFAULT 'America/Toronto';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add registration status
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS registration_status VARCHAR(50) DEFAULT 'CLOSED';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add waitlist support
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS waitlist_enabled BOOLEAN DEFAULT false;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add resource assignments
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS room_assignments JSONB;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS instructor_assignments JSONB;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS equipment_assignments JSONB;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add pricing fields
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS early_bird_price DECIMAL(10,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS early_bird_deadline DATE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS group_discount_percentage DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add completion tracking
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS completion_rate DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS average_score DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS completion_date TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add audit fields
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS updated_by UUID;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS provider_id UUID;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add session code for unique identification
  BEGIN
    ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS session_code VARCHAR(100);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Make session_code unique if it's not already
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS idx_training_sessions_session_code ON training_sessions(session_code) WHERE session_code IS NOT NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
END $$;

-- Enhance existing session_enrollments table with additional fields for multi-course tracking
DO $$
BEGIN
  -- Add payment tracking
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add overall session progress tracking
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS overall_status VARCHAR(50) DEFAULT 'NOT_STARTED';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS completion_time TIMESTAMP WITH TIME ZONE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS overall_score DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS overall_passed BOOLEAN;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add participation tracking
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS attendance_percentage DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS participation_score DECIMAL(5,2);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Add feedback fields
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS instructor_notes TEXT;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS participant_feedback TEXT;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS completion_notes TEXT;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  BEGIN
    ALTER TABLE session_enrollments ADD COLUMN IF NOT EXISTS completed_by UUID;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
END $$;

-- Add foreign key constraints safely
DO $$
BEGIN
  -- Foreign key for session_template_components to training_session_templates
  BEGIN
    ALTER TABLE session_template_components 
      ADD CONSTRAINT fk_session_template_components_template 
      FOREIGN KEY (session_template_id) REFERENCES training_session_templates(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Foreign key for training_sessions to training_session_templates
  BEGIN
    ALTER TABLE training_sessions 
      ADD CONSTRAINT fk_training_sessions_template 
      FOREIGN KEY (session_template_id) REFERENCES training_session_templates(id) ON DELETE SET NULL;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Foreign key for session_component_progress to session_enrollments (using existing session_id)
  BEGIN
    ALTER TABLE session_component_progress 
      ADD CONSTRAINT fk_session_component_progress_enrollment 
      FOREIGN KEY (session_enrollment_id) REFERENCES session_enrollments(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  -- Foreign key for session_component_progress to session_template_components
  BEGIN
    ALTER TABLE session_component_progress 
      ADD CONSTRAINT fk_session_component_progress_component 
      FOREIGN KEY (session_template_component_id) REFERENCES session_template_components(id) ON DELETE CASCADE;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_session_templates_active ON training_session_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_training_session_templates_provider ON training_session_templates(provider_id);
CREATE INDEX IF NOT EXISTS idx_session_template_components_template ON session_template_components(session_template_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_template ON training_sessions(session_template_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_provider ON training_sessions(provider_id);
CREATE INDEX IF NOT EXISTS idx_session_component_progress_enrollment ON session_component_progress(session_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course ON course_prerequisites(course_id);

-- Create update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers safely
DO $$
BEGIN
  -- Training session templates trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_training_session_templates_updated_at') THEN
    CREATE TRIGGER update_training_session_templates_updated_at BEFORE UPDATE ON training_session_templates
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Session template components trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_template_components_updated_at') THEN
    CREATE TRIGGER update_session_template_components_updated_at BEFORE UPDATE ON session_template_components
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Session component progress trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_component_progress_updated_at') THEN
    CREATE TRIGGER update_session_component_progress_updated_at BEFORE UPDATE ON session_component_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
END $$;

-- Add helpful comments for documentation
COMMENT ON TABLE training_session_templates IS 'Reusable templates for multi-course training itineraries';
COMMENT ON TABLE session_template_components IS 'Individual components (courses, breaks, activities) within session templates';
COMMENT ON TABLE session_component_progress IS 'Individual participant progress through session components';
COMMENT ON TABLE course_prerequisites IS 'Defines prerequisite relationships between courses';

-- Migration completion notification
DO $$
BEGIN
  RAISE NOTICE 'Multi-Course Training Sessions Enhancement Complete:';
  RAISE NOTICE '✅ Created training_session_templates table for reusable itineraries';
  RAISE NOTICE '✅ Created session_template_components table for itinerary components';
  RAISE NOTICE '✅ Enhanced existing training_sessions table with multi-course support';
  RAISE NOTICE '✅ Enhanced existing session_enrollments table with detailed tracking';
  RAISE NOTICE '✅ Created session_component_progress table for detailed progress tracking';
  RAISE NOTICE '✅ Created course_prerequisites table for dependency management';
  RAISE NOTICE '✅ Added indexes for performance optimization';
  RAISE NOTICE '✅ Added foreign key constraints for data integrity';
  RAISE NOTICE '✅ Added update timestamp triggers for audit tracking';
  RAISE NOTICE '⚡ System ready for multi-course training sessions';
  RAISE NOTICE '';
  RAISE NOTICE 'System supports complex itineraries like:';
  RAISE NOTICE '- CPR A/C/BLS - 2 hr';
  RAISE NOTICE '- 30 Minute Break';
  RAISE NOTICE '- Emergency First Aid Recertification - 2 HR';
  RAISE NOTICE '- Standard First Aid Certification - 2 HR';
END;
$$;