-- Data Migration: Update existing profiles with organization and job_title data
-- Date: 2025-05-23

-- Create a temporary table to track migration status
CREATE TEMP TABLE IF NOT EXISTS profile_migration_status (
    id UUID PRIMARY KEY,
    email TEXT,
    display_name TEXT,
    organization TEXT,
    job_title TEXT,
    status TEXT,
    notes TEXT
);

-- Step 1: Insert all profiles that need updating into our tracking table
INSERT INTO profile_migration_status (id, email, display_name, organization, job_title, status, notes)
SELECT 
    id, 
    email, 
    display_name,
    organization,
    job_title,
    'PENDING',
    'Initial assessment'
FROM 
    profiles
WHERE 
    organization IS NULL OR organization = '' OR
    job_title IS NULL OR job_title = '';

-- Step 2: Try to extract organization from email domains
-- This updates profiles where the email domain might indicate the organization
WITH email_domains AS (
    SELECT 
        id,
        email,
        split_part(email, '@', 2) AS domain
    FROM 
        profile_migration_status
    WHERE 
        (organization IS NULL OR organization = '')
        AND email LIKE '%@%'
)
UPDATE profiles
SET 
    organization = CASE
        -- Common domains should not be used as organization names
        WHEN domain IN ('gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com') THEN 'Unknown Organization'
        -- For other domains, use the domain name as a starting point
        ELSE initcap(split_part(domain, '.', 1)) || ' ' || initcap(split_part(domain, '.', 2))
    END
FROM 
    email_domains
WHERE 
    profiles.id = email_domains.id;

-- Update the status in our tracking table
UPDATE profile_migration_status
SET 
    status = 'UPDATED',
    notes = 'Organization derived from email domain',
    organization = p.organization
FROM 
    profiles p
WHERE 
    profile_migration_status.id = p.id
    AND profile_migration_status.organization IS NULL
    AND p.organization IS NOT NULL;

-- Step 3: Set default job titles based on role if available
UPDATE profiles
SET 
    job_title = CASE
        WHEN role = 'SA' THEN 'System Administrator'
        WHEN role = 'AD' THEN 'Administrator'
        WHEN role = 'AP' THEN 'Authorized Provider'
        WHEN role = 'IC' THEN 'Certified Instructor'
        WHEN role = 'IP' THEN 'Provisional Instructor'
        WHEN role = 'IT' THEN 'Instructor Trainee'
        ELSE 'User'
    END
WHERE 
    (job_title IS NULL OR job_title = '')
    AND role IS NOT NULL;

-- Update the status in our tracking table
UPDATE profile_migration_status
SET 
    status = 'UPDATED',
    notes = CASE 
        WHEN notes = 'Initial assessment' THEN 'Job title derived from role'
        ELSE notes || '; Job title derived from role'
    END,
    job_title = p.job_title
FROM 
    profiles p
WHERE 
    profile_migration_status.id = p.id
    AND profile_migration_status.job_title IS NULL
    AND p.job_title IS NOT NULL;

-- Step 4: For any remaining records without organization, set a default
UPDATE profiles
SET 
    organization = 'Unknown Organization'
WHERE 
    (organization IS NULL OR organization = '');

-- Update the status in our tracking table
UPDATE profile_migration_status
SET 
    status = 'UPDATED',
    notes = CASE 
        WHEN notes = 'Initial assessment' THEN 'Default organization applied'
        ELSE notes || '; Default organization applied'
    END,
    organization = 'Unknown Organization'
WHERE 
    organization IS NULL;

-- Step 5: For any remaining records without job title, set a default
UPDATE profiles
SET 
    job_title = 'User'
WHERE 
    (job_title IS NULL OR job_title = '');

-- Update the status in our tracking table
UPDATE profile_migration_status
SET 
    status = 'UPDATED',
    notes = CASE 
        WHEN notes = 'Initial assessment' THEN 'Default job title applied'
        ELSE notes || '; Default job title applied'
    END,
    job_title = 'User'
WHERE 
    job_title IS NULL;

-- Step 6: Update auth.users metadata to match the profiles table
-- First check if phone column exists in profiles table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'profiles'
        AND column_name = 'phone'
    ) THEN
        -- If phone column exists, include it in the update
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'display_name', p.display_name,
            'phone', p.phone,
            'organization', p.organization,
            'job_title', p.job_title
        )
        FROM profiles p
        WHERE auth.users.id = p.id;
    ELSE
        -- If phone column doesn't exist, exclude it from the update
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_build_object(
            'display_name', p.display_name,
            'organization', p.organization,
            'job_title', p.job_title
        )
        FROM profiles p
        WHERE auth.users.id = p.id;
    END IF;
END $$;

-- Step 7: Generate a report of the migration
SELECT 
    status,
    count(*) as count,
    string_agg(DISTINCT notes, ', ') as notes
FROM 
    profile_migration_status
GROUP BY 
    status;

-- Step 8: Export the migration status table to a CSV file for review (this is a comment, as it would be done outside SQL)
-- \COPY profile_migration_status TO '/tmp/profile_migration_status.csv' CSV HEADER;

-- Step 9: Clean up the temporary table
DROP TABLE profile_migration_status;

-- Final verification
SELECT 
    count(*) as total_profiles,
    count(CASE WHEN organization IS NULL OR organization = '' THEN 1 END) as missing_organization,
    count(CASE WHEN job_title IS NULL OR job_title = '' THEN 1 END) as missing_job_title
FROM 
    profiles;