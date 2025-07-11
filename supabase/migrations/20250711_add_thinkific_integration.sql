-- Migration: Add Thinkific Integration Fields and Tables
-- Created: 2025-07-11
-- Description: Adds Thinkific integration fields to enrollments table and creates supporting tables

-- =====================================================
-- 1. Add Thinkific fields to enrollments table
-- =====================================================

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS thinkific_enrollment_id TEXT,
ADD COLUMN IF NOT EXISTS thinkific_course_id TEXT,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
ADD COLUMN IF NOT EXISTS thinkific_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS thinkific_completion_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS practical_score DECIMAL(5,2) CHECK (practical_score >= 0 AND practical_score <= 100),
ADD COLUMN IF NOT EXISTS written_score DECIMAL(5,2) CHECK (written_score >= 0 AND written_score <= 100),
ADD COLUMN IF NOT EXISTS total_score DECIMAL(5,2) CHECK (total_score >= 0 AND total_score <= 100),
ADD COLUMN IF NOT EXISTS thinkific_passed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_thinkific_sync TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'PENDING' CHECK (sync_status IN ('PENDING', 'SYNCED', 'ERROR', 'NOT_FOUND', 'MANUAL_REVIEW'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_thinkific_enrollment_id ON enrollments(thinkific_enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_thinkific_course_id ON enrollments(thinkific_course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_sync_status ON enrollments(sync_status);
CREATE INDEX IF NOT EXISTS idx_enrollments_last_thinkific_sync ON enrollments(last_thinkific_sync);

-- =====================================================
-- 2. Add thinkific_course_id to course_offerings table
-- =====================================================

ALTER TABLE course_offerings 
ADD COLUMN IF NOT EXISTS thinkific_course_id TEXT;

CREATE INDEX IF NOT EXISTS idx_course_offerings_thinkific_course_id ON course_offerings(thinkific_course_id);

-- =====================================================
-- 3. Create course_thinkific_mappings table
-- =====================================================

CREATE TABLE IF NOT EXISTS course_thinkific_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    thinkific_course_id TEXT NOT NULL,
    thinkific_course_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique mapping per course offering
    UNIQUE(course_offering_id, thinkific_course_id)
);

-- Indexes for course mappings
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_course_offering_id ON course_thinkific_mappings(course_offering_id);
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_thinkific_course_id ON course_thinkific_mappings(thinkific_course_id);
CREATE INDEX IF NOT EXISTS idx_course_thinkific_mappings_is_active ON course_thinkific_mappings(is_active);

-- =====================================================
-- 4. Create enrollment_sync_logs table
-- =====================================================

CREATE TABLE IF NOT EXISTS enrollment_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    sync_type TEXT NOT NULL CHECK (sync_type IN ('MANUAL', 'BULK', 'AUTOMATIC')),
    sync_status TEXT NOT NULL CHECK (sync_status IN ('SUCCESS', 'FAILED')),
    thinkific_data JSONB,
    error_message TEXT,
    sync_duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for sync logs
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_enrollment_id ON enrollment_sync_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_sync_status ON enrollment_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_sync_type ON enrollment_sync_logs(sync_type);
CREATE INDEX IF NOT EXISTS idx_enrollment_sync_logs_created_at ON enrollment_sync_logs(created_at);

-- =====================================================
-- 5. Create updated_at trigger for course_thinkific_mappings
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to course_thinkific_mappings
DROP TRIGGER IF EXISTS update_course_thinkific_mappings_updated_at ON course_thinkific_mappings;
CREATE TRIGGER update_course_thinkific_mappings_updated_at
    BEFORE UPDATE ON course_thinkific_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE course_thinkific_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollment_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_thinkific_mappings
CREATE POLICY "Users can view course mappings" ON course_thinkific_mappings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage course mappings" ON course_thinkific_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- RLS Policies for enrollment_sync_logs
CREATE POLICY "Users can view their enrollment sync logs" ON enrollment_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN profiles p ON e.user_id = p.id
            WHERE e.id = enrollment_sync_logs.enrollment_id
            AND (p.id = auth.uid() OR EXISTS (
                SELECT 1 FROM profiles admin_p 
                WHERE admin_p.id = auth.uid() 
                AND admin_p.role IN ('ADMIN', 'SUPER_ADMIN', 'INSTRUCTOR', 'TRAINING_COORDINATOR')
            ))
        )
    );

CREATE POLICY "Admins can manage enrollment sync logs" ON enrollment_sync_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN', 'TRAINING_COORDINATOR')
        )
    );

-- =====================================================
-- 7. Helpful Views for Thinkific Integration
-- =====================================================

-- View for enrollments with Thinkific data
CREATE OR REPLACE VIEW enrollments_with_thinkific AS
SELECT 
    e.*,
    p.display_name as student_name,
    p.email as student_email,
    co.start_date,
    co.end_date,
    c.name as course_name,
    co.thinkific_course_id as course_offering_thinkific_id,
    ctm.thinkific_course_name,
    ctm.is_active as mapping_active,
    
    -- Thinkific sync status indicators
    CASE 
        WHEN e.sync_status = 'SYNCED' AND e.last_thinkific_sync > NOW() - INTERVAL '24 hours' 
        THEN 'CURRENT'
        WHEN e.sync_status = 'SYNCED' 
        THEN 'STALE'
        WHEN e.sync_status = 'ERROR' 
        THEN 'ERROR'
        ELSE 'PENDING'
    END as sync_freshness,
    
    -- Progress indicators
    CASE 
        WHEN e.completion_percentage = 100 THEN 'COMPLETED'
        WHEN e.completion_percentage >= 80 THEN 'NEAR_COMPLETE'
        WHEN e.completion_percentage >= 50 THEN 'IN_PROGRESS'
        WHEN e.completion_percentage > 0 THEN 'STARTED'
        ELSE 'NOT_STARTED'
    END as progress_status

FROM enrollments e
JOIN profiles p ON e.user_id = p.id
JOIN course_offerings co ON e.course_offering_id = co.id
JOIN courses c ON co.course_id = c.id
LEFT JOIN course_thinkific_mappings ctm ON co.id = ctm.course_offering_id AND ctm.is_active = TRUE;

-- View for sync statistics
CREATE OR REPLACE VIEW thinkific_sync_statistics AS
SELECT 
    COUNT(*) as total_enrollments,
    COUNT(CASE WHEN sync_status = 'SYNCED' THEN 1 END) as synced_enrollments,
    COUNT(CASE WHEN sync_status = 'ERROR' THEN 1 END) as failed_syncs,
    COUNT(CASE WHEN sync_status = 'PENDING' THEN 1 END) as pending_syncs,
    COUNT(CASE WHEN sync_status = 'NOT_FOUND' THEN 1 END) as not_found_syncs,
    COUNT(CASE WHEN sync_status = 'MANUAL_REVIEW' THEN 1 END) as manual_review_syncs,
    MAX(last_thinkific_sync) as most_recent_sync,
    AVG(completion_percentage) as average_completion_percentage,
    COUNT(CASE WHEN thinkific_passed = TRUE THEN 1 END) as passed_count,
    COUNT(CASE WHEN completion_percentage = 100 THEN 1 END) as completed_count
FROM enrollments
WHERE sync_status IS NOT NULL;

-- =====================================================
-- 8. Sample Data / Comments
-- =====================================================

-- Add helpful comments to tables
COMMENT ON TABLE course_thinkific_mappings IS 'Maps local course offerings to Thinkific courses for data synchronization';
COMMENT ON TABLE enrollment_sync_logs IS 'Audit trail for Thinkific enrollment data synchronization operations';

COMMENT ON COLUMN enrollments.thinkific_enrollment_id IS 'Thinkific enrollment ID for this student-course pairing';
COMMENT ON COLUMN enrollments.completion_percentage IS 'Course completion percentage from Thinkific (0-100)';
COMMENT ON COLUMN enrollments.practical_score IS 'Practical assessment score from Thinkific';
COMMENT ON COLUMN enrollments.written_score IS 'Written assessment score from Thinkific';
COMMENT ON COLUMN enrollments.total_score IS 'Overall weighted score from Thinkific';
COMMENT ON COLUMN enrollments.sync_status IS 'Current synchronization status with Thinkific';

-- =====================================================
-- 9. Grant necessary permissions
-- =====================================================

-- Grant SELECT on views to authenticated users
GRANT SELECT ON enrollments_with_thinkific TO authenticated;
GRANT SELECT ON thinkific_sync_statistics TO authenticated;

-- Grant appropriate permissions on tables
GRANT SELECT, INSERT, UPDATE ON course_thinkific_mappings TO authenticated;
GRANT SELECT, INSERT ON enrollment_sync_logs TO authenticated;