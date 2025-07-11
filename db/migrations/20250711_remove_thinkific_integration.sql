-- Remove Thinkific integration from database
-- Migration: Remove all Thinkific fields, tables, and indexes
-- Date: 2025-07-11

-- Start transaction
BEGIN;

-- Drop dependent views that reference Thinkific columns
DROP VIEW IF EXISTS thinkific_sync_statistics CASCADE;
DROP VIEW IF EXISTS enrollment_thinkific_view CASCADE;
DROP VIEW IF EXISTS course_progress_view CASCADE;

-- Drop indexes related to Thinkific fields from enrollments table
DROP INDEX IF EXISTS idx_enrollments_thinkific_course_id;
DROP INDEX IF EXISTS idx_enrollments_thinkific_enrollment_id;
DROP INDEX IF EXISTS idx_enrollments_sync_status;
DROP INDEX IF EXISTS idx_enrollments_last_sync;

-- Drop indexes from sync logs table
DROP INDEX IF EXISTS idx_enrollment_sync_logs_enrollment_id;
DROP INDEX IF EXISTS idx_enrollment_sync_logs_sync_status;
DROP INDEX IF EXISTS idx_enrollment_sync_logs_created_at;
DROP INDEX IF EXISTS idx_enrollment_sync_logs_sync_type;

-- Drop indexes from course mappings table
DROP INDEX IF EXISTS idx_course_thinkific_mappings_course_offering_id;
DROP INDEX IF EXISTS idx_course_thinkific_mappings_thinkific_course_id;

-- Drop entire Thinkific-related tables
DROP TABLE IF EXISTS enrollment_sync_logs CASCADE;
DROP TABLE IF EXISTS course_thinkific_mappings CASCADE;

-- Remove Thinkific columns from enrollments table
ALTER TABLE enrollments
DROP COLUMN IF EXISTS thinkific_course_id,
DROP COLUMN IF EXISTS thinkific_enrollment_id,
DROP COLUMN IF EXISTS thinkific_user_id,
DROP COLUMN IF EXISTS completion_percentage,
DROP COLUMN IF EXISTS thinkific_started_at,
DROP COLUMN IF EXISTS thinkific_completed_at,
DROP COLUMN IF EXISTS practical_score,
DROP COLUMN IF EXISTS written_score,
DROP COLUMN IF EXISTS total_score,
DROP COLUMN IF EXISTS last_thinkific_sync,
DROP COLUMN IF EXISTS sync_status;

-- Remove Thinkific columns from certificate_requests table
ALTER TABLE certificate_requests
DROP COLUMN IF EXISTS thinkific_course_id,
DROP COLUMN IF EXISTS thinkific_enrollment_id,
DROP COLUMN IF EXISTS last_score_sync;

-- Commit transaction
COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Removed all Thinkific integration fields from enrollments table';
  RAISE NOTICE '✅ Removed all Thinkific integration fields from certificate_requests table';
  RAISE NOTICE '✅ Dropped enrollment_sync_logs table';
  RAISE NOTICE '✅ Dropped course_thinkific_mappings table';
  RAISE NOTICE '✅ Dropped all Thinkific-related indexes';
  RAISE NOTICE '🎉 Thinkific integration completely removed from database';
END $$;