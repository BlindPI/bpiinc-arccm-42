-- Add Thinkific integration fields to enrollments table
-- Migration: Add Thinkific fields to enrollments
-- Date: 2025-01-11

-- Add Thinkific integration columns to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS thinkific_course_id TEXT,
ADD COLUMN IF NOT EXISTS thinkific_enrollment_id TEXT,
ADD COLUMN IF NOT EXISTS thinkific_user_id TEXT,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS thinkific_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thinkific_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS practical_score NUMERIC(5,2) CHECK (practical_score >= 0 AND practical_score <= 100),
ADD COLUMN IF NOT EXISTS written_score NUMERIC(5,2) CHECK (written_score >= 0 AND written_score <= 100),
ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2) CHECK (total_score >= 0 AND total_score <= 100),
ADD COLUMN IF NOT EXISTS last_thinkific_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'ERROR', 'NOT_FOUND', 'MANUAL_REVIEW'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enrollments_thinkific_course_id ON enrollments(thinkific_course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_thinkific_enrollment_id ON enrollments(thinkific_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_sync_status ON enrollments(sync_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_last_sync ON enrollments(last_thinkific_sync);

-- Add comments for documentation
COMMENT ON COLUMN enrollments.thinkific_course_id IS 'Thinkific course ID for mapping to external LMS';
COMMENT ON COLUMN enrollments.thinkific_enrollment_id IS 'Thinkific enrollment ID for tracking external enrollment';
COMMENT ON COLUMN enrollments.thinkific_user_id IS 'Thinkific user ID for the enrolled student';
COMMENT ON COLUMN enrollments.completion_percentage IS 'Course completion percentage from Thinkific (0-100)';
COMMENT ON COLUMN enrollments.thinkific_started_at IS 'When student started the course in Thinkific';
COMMENT ON COLUMN enrollments.thinkific_completed_at IS 'When student completed the course in Thinkific';
COMMENT ON COLUMN enrollments.practical_score IS 'Practical assessment score from Thinkific';
COMMENT ON COLUMN enrollments.written_score IS 'Written assessment score from Thinkific';
COMMENT ON COLUMN enrollments.total_score IS 'Overall calculated score from Thinkific';
COMMENT ON COLUMN enrollments.last_thinkific_sync IS 'Last time data was synced from Thinkific';
COMMENT ON COLUMN enrollments.sync_status IS 'Status of Thinkific data synchronization';

-- Create course mapping table for local courses to Thinkific courses
CREATE TABLE IF NOT EXISTS course_thinkific_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    thinkific_course_id TEXT NOT NULL,
    thinkific_course_name TEXT,
    mapping_created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_offering_id, thinkific_course_id)
);

-- Add indexes for course mappings
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_offering_id ON course_thinkific_mappings(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_thinkific_id ON course_thinkific_mappings(thinkific_course_id);
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_active ON course_thinkific_mappings(is_active);

-- Add comments for course mappings table
COMMENT ON TABLE course_thinkific_mappings IS 'Maps local course offerings to Thinkific courses for enrollment sync';
COMMENT ON COLUMN course_thinkific_mappings.course_offering_id IS 'Local course offering ID';
COMMENT ON COLUMN course_thinkific_mappings.thinkific_course_id IS 'Thinkific course ID';
COMMENT ON COLUMN course_thinkific_mappings.thinkific_course_name IS 'Cached Thinkific course name for display';
COMMENT ON COLUMN course_thinkific_mappings.mapping_created_by IS 'User who created this mapping';
COMMENT ON COLUMN course_thinkific_mappings.is_active IS 'Whether this mapping is currently active';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_course_thinkific_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_course_thinkific_mappings_updated_at
    BEFORE UPDATE ON course_thinkific_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_course_thinkific_mappings_updated_at();

-- Create sync log table for tracking sync operations
CREATE TABLE IF NOT EXISTS enrollment_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('MANUAL', 'SCHEDULED', 'BULK', 'AUTOMATIC')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('SUCCESS', 'ERROR', 'PARTIAL')),
    thinkific_data JSONB,
    error_message TEXT,
    sync_duration_ms INTEGER,
    synced_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for sync logs
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_enrollment_id ON enrollment_sync_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_sync_status ON enrollment_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_created_at ON enrollment_sync_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_sync_type ON enrollment_sync_logs(sync_type);

-- Add comments for sync logs table
COMMENT ON TABLE enrollment_sync_logs IS 'Logs all Thinkific sync operations for audit and debugging';
COMMENT ON COLUMN enrollment_sync_logs.enrollment_id IS 'Enrollment that was synced';
COMMENT ON COLUMN enrollment_sync_logs.sync_type IS 'Type of sync operation performed';
COMMENT ON COLUMN enrollment_sync_logs.sync_status IS 'Result of the sync operation';
COMMENT ON COLUMN enrollment_sync_logs.thinkific_data IS 'Raw Thinkific data that was synced';
COMMENT ON COLUMN enrollment_sync_logs.error_message IS 'Error message if sync failed';
COMMENT ON COLUMN enrollment_sync_logs.sync_duration_ms IS 'How long the sync operation took in milliseconds';
COMMENT ON COLUMN enrollment_sync_logs.synced_by IS 'User who initiated the sync';