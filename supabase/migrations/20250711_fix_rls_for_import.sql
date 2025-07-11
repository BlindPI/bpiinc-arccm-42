-- Fix RLS policies to allow import process to work
-- The import process needs to read course mappings and offerings

-- Update RLS policy for course_thinkific_mappings to allow authenticated users to read
DROP POLICY IF EXISTS "Users can view course mappings" ON course_thinkific_mappings;
CREATE POLICY "Users can view course mappings" ON course_thinkific_mappings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update RLS policy to allow authenticated users to insert/update course mappings during import
DROP POLICY IF EXISTS "Admins can manage course mappings" ON course_thinkific_mappings;
CREATE POLICY "Admins can manage course mappings" ON course_thinkific_mappings
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN', 'TRAINING_COORDINATOR')
        )
    );

-- Allow authenticated users to insert course mappings during import
CREATE POLICY "Users can create course mappings during import" ON course_thinkific_mappings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Ensure course_offerings table allows authenticated users to read
-- Check if RLS is enabled on course_offerings first
DO $$ 
BEGIN
    -- Enable RLS on course_offerings if not already enabled
    BEGIN
        ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN
            -- Table might already have RLS enabled
            NULL;
    END;
    
    -- Create policy if it doesn't exist
    BEGIN
        CREATE POLICY "Users can view course offerings" ON course_offerings
            FOR SELECT USING (auth.role() = 'authenticated');
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, update it
            DROP POLICY "Users can view course offerings" ON course_offerings;
            CREATE POLICY "Users can view course offerings" ON course_offerings
                FOR SELECT USING (auth.role() = 'authenticated');
    END;
END $$;

-- Ensure courses table allows authenticated users to read (needed for joins)
DO $$ 
BEGIN
    -- Enable RLS on courses if not already enabled
    BEGIN
        ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
    EXCEPTION
        WHEN OTHERS THEN
            -- Table might already have RLS enabled
            NULL;
    END;
    
    -- Create policy if it doesn't exist
    BEGIN
        CREATE POLICY "Users can view courses" ON courses
            FOR SELECT USING (auth.role() = 'authenticated');
    EXCEPTION
        WHEN duplicate_object THEN
            -- Policy already exists, update it
            DROP POLICY "Users can view courses" ON courses;
            CREATE POLICY "Users can view courses" ON courses
                FOR SELECT USING (auth.role() = 'authenticated');
    END;
END $$;

-- Update enrollment_sync_logs RLS to allow simpler access for import logging
DROP POLICY IF EXISTS "Users can view their enrollment sync logs" ON enrollment_sync_logs;
CREATE POLICY "Users can view enrollment sync logs" ON enrollment_sync_logs
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage enrollment sync logs" ON enrollment_sync_logs;
CREATE POLICY "Users can create enrollment sync logs" ON enrollment_sync_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage enrollment sync logs" ON enrollment_sync_logs
    FOR ALL USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN', 'TRAINING_COORDINATOR')
        )
    );

-- Grant additional permissions needed for import process
GRANT SELECT ON course_offerings TO authenticated;
GRANT SELECT ON courses TO authenticated;

-- Add comment
COMMENT ON POLICY "Users can view course mappings" ON course_thinkific_mappings IS 'Allows authenticated users to read course mappings for Thinkific import process';
COMMENT ON POLICY "Users can create course mappings during import" ON course_thinkific_mappings IS 'Allows authenticated users to create course mappings during Thinkific import process';