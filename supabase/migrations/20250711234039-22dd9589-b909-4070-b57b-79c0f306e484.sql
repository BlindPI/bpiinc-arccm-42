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

-- Remove remaining Thinkific columns from course_offerings table
ALTER TABLE course_offerings
DROP COLUMN IF EXISTS thinkific_course_id,
DROP COLUMN IF EXISTS thinkific_data,
DROP COLUMN IF EXISTS sync_status,
DROP COLUMN IF EXISTS last_thinkific_sync;

-- Update find_or_create_student_profile function to be Thinkific-agnostic
CREATE OR REPLACE FUNCTION public.find_or_create_student_profile(
    p_email character varying, 
    p_first_name character varying DEFAULT NULL::character varying, 
    p_last_name character varying DEFAULT NULL::character varying, 
    p_external_student_id character varying DEFAULT NULL::character varying, 
    p_student_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_profile_id UUID;
    v_display_name VARCHAR(255);
BEGIN
    -- Try to find existing profile by email
    SELECT id INTO v_profile_id
    FROM student_enrollment_profiles
    WHERE email = p_email;
    
    -- If found, update with latest info and return
    IF v_profile_id IS NOT NULL THEN
        UPDATE student_enrollment_profiles
        SET 
            first_name = COALESCE(p_first_name, first_name),
            last_name = COALESCE(p_last_name, last_name),
            external_student_id = COALESCE(p_external_student_id, external_student_id),
            student_metadata = student_metadata || p_student_metadata,
            last_sync_date = NOW(),
            updated_at = NOW()
        WHERE id = v_profile_id;
        
        RETURN v_profile_id;
    END IF;
    
    -- Create display name
    v_display_name := TRIM(CONCAT(COALESCE(p_first_name, ''), ' ', COALESCE(p_last_name, '')));
    IF v_display_name = '' THEN
        v_display_name := p_email;
    END IF;
    
    -- Create new profile
    INSERT INTO student_enrollment_profiles (
        email,
        first_name,
        last_name,
        display_name,
        external_student_id,
        student_metadata,
        import_date,
        last_sync_date,
        imported_from
    ) VALUES (
        p_email,
        p_first_name,
        p_last_name,
        v_display_name,
        p_external_student_id,
        p_student_metadata,
        NOW(),
        NOW(),
        'CSV_IMPORT'
    ) RETURNING id INTO v_profile_id;
    
    RETURN v_profile_id;
END;
$function$;

-- Drop orphaned trigger function if it exists
DROP FUNCTION IF EXISTS public.update_course_thinkific_mappings_updated_at() CASCADE;

-- Commit transaction
COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Removed all Thinkific integration fields from enrollments table';
  RAISE NOTICE '✅ Removed all Thinkific integration fields from certificate_requests table';
  RAISE NOTICE '✅ Removed all Thinkific integration fields from course_offerings table';
  RAISE NOTICE '✅ Dropped enrollment_sync_logs table';
  RAISE NOTICE '✅ Dropped course_thinkific_mappings table';
  RAISE NOTICE '✅ Dropped all Thinkific-related indexes';
  RAISE NOTICE '✅ Updated find_or_create_student_profile function';
  RAISE NOTICE '🎉 Thinkific integration completely removed from database';
END $$;