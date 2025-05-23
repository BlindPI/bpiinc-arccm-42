-- Migration: Add organization and job_title fields to profiles table
-- Date: 2025-05-23

-- Check if organization column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'organization'
    ) THEN
        ALTER TABLE profiles ADD COLUMN organization VARCHAR(255);
    END IF;
END $$;

-- Check if job_title column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'job_title'
    ) THEN
        ALTER TABLE profiles ADD COLUMN job_title VARCHAR(255);
    END IF;
END $$;

-- Update existing profiles with default values if needed
UPDATE profiles 
SET 
    organization = 'Not specified',
    job_title = 'Not specified'
WHERE 
    organization IS NULL OR job_title IS NULL;

-- Add comments to the new columns
COMMENT ON COLUMN profiles.organization IS 'User''s organization or company name';
COMMENT ON COLUMN profiles.job_title IS 'User''s job title or position';

-- Create an index on organization for faster searches
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization);

-- Check if phone column exists in profiles table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone'
    ) THEN
        ALTER TABLE profiles ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- Update the auth.users metadata if needed (for Supabase)
-- This is needed because we're storing some profile data in auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION sync_user_profile_metadata()
RETURNS TRIGGER AS $$
DECLARE
    has_phone_column BOOLEAN;
BEGIN
    -- Check if phone column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone'
    ) INTO has_phone_column;

    -- When profile is updated, update the user metadata
    IF TG_OP = 'UPDATE' THEN
        IF has_phone_column THEN
            UPDATE auth.users
            SET raw_user_meta_data = jsonb_build_object(
                'display_name', NEW.display_name,
                'phone', NEW.phone,
                'organization', NEW.organization,
                'job_title', NEW.job_title
            )
            WHERE id = NEW.id;
        ELSE
            UPDATE auth.users
            SET raw_user_meta_data = jsonb_build_object(
                'display_name', NEW.display_name,
                'organization', NEW.organization,
                'job_title', NEW.job_title
            )
            WHERE id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_profile_update ON profiles;

-- Create the trigger
CREATE TRIGGER on_profile_update
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION sync_user_profile_metadata();

-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
    has_phone_column BOOLEAN;
    insert_columns TEXT;
    insert_values TEXT;
    update_clause TEXT;
BEGIN
    -- Check if phone column exists
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone'
    ) INTO has_phone_column;

    -- Dynamically build the INSERT statement based on available columns
    IF has_phone_column THEN
        -- Extract profile data from user metadata with phone
        INSERT INTO profiles (
            id,
            display_name,
            email,
            phone,
            organization,
            job_title,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'display_name',
            NEW.email,
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'organization',
            NEW.raw_user_meta_data->>'job_title',
            NEW.created_at,
            NEW.created_at
        )
        ON CONFLICT (id) DO UPDATE
        SET
            display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            phone = EXCLUDED.phone,
            organization = EXCLUDED.organization,
            job_title = EXCLUDED.job_title,
            updated_at = NOW();
    ELSE
        -- Extract profile data from user metadata without phone
        INSERT INTO profiles (
            id,
            display_name,
            email,
            organization,
            job_title,
            created_at,
            updated_at
        )
        VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'display_name',
            NEW.email,
            NEW.raw_user_meta_data->>'organization',
            NEW.raw_user_meta_data->>'job_title',
            NEW.created_at,
            NEW.created_at
        )
        ON CONFLICT (id) DO UPDATE
        SET
            display_name = EXCLUDED.display_name,
            email = EXCLUDED.email,
            organization = EXCLUDED.organization,
            job_title = EXCLUDED.job_title,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION handle_new_user_signup();