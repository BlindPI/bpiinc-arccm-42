-- Add student profile link to enrollments table and create helpful view

-- Add student_profile_id column to enrollments table
ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS student_profile_id UUID;

-- Add foreign key constraint
ALTER TABLE enrollments 
ADD CONSTRAINT fk_enrollments_student_profile_id 
FOREIGN KEY (student_profile_id) REFERENCES student_enrollment_profiles(id);

-- Create index for performance
CREATE INDEX idx_enrollments_student_profile_id ON enrollments(student_profile_id);


-- Create view for easy enrollment queries with student data
CREATE OR REPLACE VIEW enrollment_with_student_profiles WITH (security_invoker=on) AS
SELECT 
    e.id,
    e.course_offering_id,
    e.student_profile_id,
    e.created_at,
    e.updated_at,
    -- Include other specific columns from enrollments as needed
    -- but avoid using e.* to prevent column duplication
    sp.email as student_email,
    sp.first_name as student_first_name,
    sp.last_name as student_last_name,
    sp.display_name as student_display_name,
    sp.thinkific_user_id,
    sp.enrollment_status as student_status,
    sp.import_date as student_import_date,
    sp.last_sync_date as student_last_sync,
    co.start_date,
    co.end_date,
    c.name as course_name,
    c.description as course_description
FROM enrollments e
LEFT JOIN student_enrollment_profiles sp ON e.student_profile_id = sp.id
LEFT JOIN course_offerings co ON e.course_offering_id = co.id
LEFT JOIN courses c ON co.course_id = c.id;


-- Grant access to the view
GRANT SELECT ON enrollment_with_student_profiles TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW enrollment_with_student_profiles IS 'Convenient view that joins enrollments with student profile data for easy querying and display.';