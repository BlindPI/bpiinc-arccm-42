-- Create student enrollment profiles table for Thinkific student data
-- This table stores imported student information from external LMS systems like Thinkific
-- Separate from main profiles table to avoid mixing external and system users

CREATE TABLE IF NOT EXISTS student_enrollment_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Basic student information
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(255),
    
    -- External system identifiers
    thinkific_user_id VARCHAR(50) UNIQUE,
    external_student_id VARCHAR(100), -- For future LMS integrations
    
    -- Student status and metadata
    is_active BOOLEAN DEFAULT true,
    enrollment_status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, SUSPENDED
    
    -- Import and sync tracking
    imported_from VARCHAR(50) DEFAULT 'THINKIFIC', -- THINKIFIC, MOODLE, etc.
    import_date TIMESTAMPTZ DEFAULT NOW(),
    last_sync_date TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'SYNCED', -- SYNCED, PENDING, ERROR
    
    -- Additional student data (JSON for flexibility)
    student_metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_enrollment_profiles_email ON student_enrollment_profiles(email);
CREATE INDEX IF NOT EXISTS idx_student_enrollment_profiles_thinkific_user_id ON student_enrollment_profiles(thinkific_user_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollment_profiles_status ON student_enrollment_profiles(enrollment_status, is_active);
CREATE INDEX IF NOT EXISTS idx_student_enrollment_profiles_import_date ON student_enrollment_profiles(import_date);
CREATE INDEX IF NOT EXISTS idx_student_enrollment_profiles_sync_status ON student_enrollment_profiles(sync_status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_enrollment_profiles_updated_at
    BEFORE UPDATE ON student_enrollment_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE student_enrollment_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all student enrollment profiles (for enrollment management)
CREATE POLICY "Users can read student enrollment profiles" ON student_enrollment_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Users can insert student enrollment profiles (for import operations)
CREATE POLICY "Users can insert student enrollment profiles" ON student_enrollment_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update student enrollment profiles (for sync operations)
CREATE POLICY "Users can update student enrollment profiles" ON student_enrollment_profiles
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Policy: Only system admins can delete student enrollment profiles
CREATE POLICY "Admins can delete student enrollment profiles" ON student_enrollment_profiles
    FOR DELETE USING (
        auth.role() = 'authenticated' AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'ADMIN'
        )
    );

-- Create a function to find or create student enrollment profile
CREATE OR REPLACE FUNCTION find_or_create_student_profile(
    p_email VARCHAR(255),
    p_first_name VARCHAR(100) DEFAULT NULL,
    p_last_name VARCHAR(100) DEFAULT NULL,
    p_thinkific_user_id VARCHAR(50) DEFAULT NULL,
    p_student_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
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
            thinkific_user_id = COALESCE(p_thinkific_user_id, thinkific_user_id),
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
        thinkific_user_id,
        student_metadata,
        import_date,
        last_sync_date
    ) VALUES (
        p_email,
        p_first_name,
        p_last_name,
        v_display_name,
        p_thinkific_user_id,
        p_student_metadata,
        NOW(),
        NOW()
    ) RETURNING id INTO v_profile_id;
    
    RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION find_or_create_student_profile TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE student_enrollment_profiles IS 'Stores student profile information imported from external LMS systems like Thinkific. Separate from main user profiles to maintain clean separation between system users and external students.';
COMMENT ON FUNCTION find_or_create_student_profile IS 'Utility function to find existing student profile by email or create new one with provided data. Used during import processes.';