-- Debug profile display names issue
-- Check what data exists in profiles table

-- Sample profiles to see what fields have data
SELECT 
  id,
  display_name,
  email,
  role,
  first_name,
  last_name,
  full_name,
  created_at
FROM profiles 
WHERE id IN (
  SELECT user_id 
  FROM team_members 
  WHERE team_id IN (
    SELECT id 
    FROM teams 
    WHERE name LIKE '%Barrie First Aid%'
  )
  LIMIT 5
);

-- Check all profile columns to see what's available
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Count how many profiles have display_name vs other name fields
SELECT 
  COUNT(*) as total_profiles,
  COUNT(display_name) as has_display_name,
  COUNT(first_name) as has_first_name,
  COUNT(last_name) as has_last_name,
  COUNT(full_name) as has_full_name,
  COUNT(email) as has_email
FROM profiles;

-- Sample profiles with different name field combinations
SELECT 
  id,
  display_name,
  first_name,
  last_name,
  full_name,
  email,
  CASE 
    WHEN display_name IS NOT NULL AND display_name != '' THEN display_name
    WHEN full_name IS NOT NULL AND full_name != '' THEN full_name
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN CONCAT(first_name, ' ', last_name)
    WHEN first_name IS NOT NULL THEN first_name
    WHEN email IS NOT NULL THEN SPLIT_PART(email, '@', 1)
    ELSE 'Unknown User'
  END as computed_name
FROM profiles 
LIMIT 10;