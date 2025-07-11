-- Comprehensive RLS fix for Thinkific import process
-- Enable row level security policies for import operations

-- Drop existing restrictive policies and create permissive ones for authenticated users

-- courses table
DROP POLICY IF EXISTS "Allow authenticated users to read courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to insert courses" ON courses;
DROP POLICY IF EXISTS "Allow authenticated users to update courses" ON courses;

CREATE POLICY "Allow authenticated users to read courses" ON courses
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert courses" ON courses
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update courses" ON courses
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- course_offerings table
DROP POLICY IF EXISTS "Allow authenticated users to read course_offerings" ON course_offerings;
DROP POLICY IF EXISTS "Allow authenticated users to insert course_offerings" ON course_offerings;
DROP POLICY IF EXISTS "Allow authenticated users to update course_offerings" ON course_offerings;

CREATE POLICY "Allow authenticated users to read course_offerings" ON course_offerings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert course_offerings" ON course_offerings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update course_offerings" ON course_offerings
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- course_thinkific_mappings table
DROP POLICY IF EXISTS "Allow authenticated users to read course_thinkific_mappings" ON course_thinkific_mappings;
DROP POLICY IF EXISTS "Allow authenticated users to insert course_thinkific_mappings" ON course_thinkific_mappings;
DROP POLICY IF EXISTS "Allow authenticated users to update course_thinkific_mappings" ON course_thinkific_mappings;

CREATE POLICY "Allow authenticated users to read course_thinkific_mappings" ON course_thinkific_mappings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert course_thinkific_mappings" ON course_thinkific_mappings
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update course_thinkific_mappings" ON course_thinkific_mappings
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- enrollments table (ensure it's accessible)
DROP POLICY IF EXISTS "Allow authenticated users to read enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow authenticated users to insert enrollments" ON enrollments;
DROP POLICY IF EXISTS "Allow authenticated users to update enrollments" ON enrollments;

CREATE POLICY "Allow authenticated users to read enrollments" ON enrollments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert enrollments" ON enrollments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update enrollments" ON enrollments
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- student_enrollment_profiles table (ensure it's accessible)
DROP POLICY IF EXISTS "Allow authenticated users to read student_enrollment_profiles" ON student_enrollment_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert student_enrollment_profiles" ON student_enrollment_profiles;
DROP POLICY IF EXISTS "Allow authenticated users to update student_enrollment_profiles" ON student_enrollment_profiles;

CREATE POLICY "Allow authenticated users to read student_enrollment_profiles" ON student_enrollment_profiles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert student_enrollment_profiles" ON student_enrollment_profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update student_enrollment_profiles" ON student_enrollment_profiles
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- enrollment_sync_logs table (ensure it's accessible)
DROP POLICY IF EXISTS "Allow authenticated users to read enrollment_sync_logs" ON enrollment_sync_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert enrollment_sync_logs" ON enrollment_sync_logs;

CREATE POLICY "Allow authenticated users to read enrollment_sync_logs" ON enrollment_sync_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert enrollment_sync_logs" ON enrollment_sync_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_offerings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON course_thinkific_mappings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON student_enrollment_profiles TO authenticated;
GRANT SELECT, INSERT ON enrollment_sync_logs TO authenticated;

-- Ensure sequence permissions for auto-incrementing IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;