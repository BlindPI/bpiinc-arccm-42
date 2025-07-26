-- ==============================================
-- DEBUG USER DISPLAY NAMES - FIND THE SOURCE
-- ==============================================

-- Check where user display names are actually stored

-- 1. Check profiles table display_name vs auth.users display_name
SELECT 
  'PROFILES_VS_AUTH' as test_name,
  p.id,
  p.display_name as profiles_display_name,
  p.email as profiles_email,
  au.raw_user_meta_data->>'display_name' as auth_display_name,
  au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.id IN (
  SELECT user_id FROM team_members 
  WHERE team_id IN (
    SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%'
  )
)
ORDER BY p.email;

-- 2. Check auth.users table directly for team members
SELECT 
  'AUTH_USERS_DIRECT' as test_name,
  au.id,
  au.email,
  au.raw_user_meta_data->>'display_name' as display_name_from_auth,
  au.raw_user_meta_data->>'full_name' as full_name_from_auth,
  au.raw_user_meta_data as full_metadata
FROM auth.users au
WHERE au.id IN (
  SELECT user_id FROM team_members 
  WHERE team_id IN (
    SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%'
  )
)
ORDER BY au.email;

-- 3. Check what's actually in profiles.display_name
SELECT 
  'PROFILES_DISPLAY_NAME_CHECK' as test_name,
  p.id,
  p.email,
  p.display_name,
  LENGTH(p.display_name) as display_name_length,
  CASE 
    WHEN p.display_name IS NULL THEN 'NULL'
    WHEN p.display_name = '' THEN 'EMPTY_STRING'
    WHEN LENGTH(p.display_name) > 0 THEN 'HAS_VALUE'
    ELSE 'UNKNOWN'
  END as display_name_status
FROM profiles p
WHERE p.id IN (
  SELECT user_id FROM team_members 
  WHERE team_id IN (
    SELECT id FROM teams WHERE name LIKE '%Barrie First Aid%'
  )
)
ORDER BY p.email;