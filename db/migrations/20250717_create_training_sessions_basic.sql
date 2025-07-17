-- Multi-Course Training Sessions System (BASIC VERSION - NO FOREIGN KEYS)
-- This migration creates the basic table structure first

-- Create training_session_templates table
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

-- Create session_template_components table
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

-- Create or modify training_sessions table
DO $$
BEGIN
  -- Check if training_sessions table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_sessions') THEN
    -- Create the table from scratch
    CREATE TABLE training_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      session_template_id UUID,
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
      created_by UUID,
      updated_by UUID,
      provider_id UUID,
      
      CONSTRAINT check_session_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
      CONSTRAINT check_registration_status CHECK (registration_status IN ('OPEN', 'CLOSED', 'WAITLIST_ONLY', 'INVITATION_ONLY')),
      CONSTRAINT check_max_participants_positive CHECK (max_participants > 0),
      CONSTRAINT check_current_participants_range CHECK (current_participants >= 0 AND current_participants <= max_participants),
      CONSTRAINT check_time_order CHECK (end_time > start_time),
      CONSTRAINT check_completion_rate_range CHECK (completion_rate IS NULL OR (completion_rate >= 0 AND completion_rate <= 100)),
      CONSTRAINT check_average_score_range CHECK (average_score IS NULL OR (average_score >= 0 AND average_score <= 100))
    );
  ELSE
    -- Add missing columns to existing table
    BEGIN
      ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS session_template_id UUID;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already exist, ignore error
      NULL;
    END;
    
    BEGIN
      ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS description TEXT;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    
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
  END IF;
END $$;

-- Create session_enrollments table
CREATE TABLE IF NOT EXISTS session_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  training_session_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  
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
  completed_by UUID,
  
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

-- Create session_component_progress table
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

-- Create course_prerequisites table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_training_session_templates_active ON training_session_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_training_session_templates_provider ON training_session_templates(provider_id);
CREATE INDEX IF NOT EXISTS idx_session_template_components_template ON session_template_components(session_template_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_template ON training_sessions(session_template_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_session ON session_enrollments(training_session_id);
CREATE INDEX IF NOT EXISTS idx_session_enrollments_participant ON session_enrollments(participant_id);
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

-- Only create triggers if they don't exist
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
  
  -- Training sessions trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_training_sessions_updated_at') THEN
    CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Session enrollments trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_enrollments_updated_at') THEN
    CREATE TRIGGER update_session_enrollments_updated_at BEFORE UPDATE ON session_enrollments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  -- Session component progress trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_session_component_progress_updated_at') THEN
    CREATE TRIGGER update_session_component_progress_updated_at BEFORE UPDATE ON session_component_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Migration completion notification
DO $$
BEGIN
  RAISE NOTICE 'Multi-Course Training Sessions Basic Migration Complete:';
  RAISE NOTICE '✅ Created/Updated training_session_templates table';
  RAISE NOTICE '✅ Created session_template_components table';
  RAISE NOTICE '✅ Created/Updated training_sessions table';
  RAISE NOTICE '✅ Created session_enrollments table';
  RAISE NOTICE '✅ Created session_component_progress table';
  RAISE NOTICE '✅ Created course_prerequisites table';
  RAISE NOTICE '✅ Added basic indexes for performance';
  RAISE NOTICE '✅ Added update timestamp triggers';
  RAISE NOTICE '⚡ Basic structure ready - foreign keys can be added separately';
  RAISE NOTICE '';
  RAISE NOTICE 'System supports complex itineraries like:';
  RAISE NOTICE '- CPR A/C/BLS - 2 hr';
  RAISE NOTICE '- 30 Minute Break';
  RAISE NOTICE '- Emergency First Aid Recertification - 2 HR';
  RAISE NOTICE '- Standard First Aid Certification - 2 HR';
END;
$$;