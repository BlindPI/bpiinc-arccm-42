-- DIAGNOSTIC SQL TO UNDERSTAND AVAILABILITY DATA STRUCTURE
-- Run this and provide results to understand what's happening

-- 1. Show actual column data types
SELECT 
    column_name, 
    data_type, 
    udt_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_availability' 
ORDER BY ordinal_position;

-- 2. Show ENUM type definitions
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('day_of_week', 'availability_type')
ORDER BY t.typname, e.enumsortorder;

-- 3. Show sample availability data with actual types
SELECT 
    id,
    user_id,
    day_of_week,
    pg_typeof(day_of_week) as day_of_week_type,
    start_time,
    end_time,
    availability_type,
    pg_typeof(availability_type) as availability_type_type,
    recurring_pattern,
    is_recurring,
    specific_date,
    is_active,
    effective_date,
    expiry_date
FROM user_availability 
LIMIT 5;

-- 4. Test what EXTRACT(DOW) returns for current dates
SELECT 
    CURRENT_DATE as test_date,
    EXTRACT(DOW FROM CURRENT_DATE) as extracted_dow,
    pg_typeof(EXTRACT(DOW FROM CURRENT_DATE)) as dow_type;

-- 5. Test the function with actual parameters for current user
-- Replace with actual user ID and role from the session
SELECT * FROM get_user_availability_for_date_range(
    '2025-07-01'::DATE,
    '2025-07-31'::DATE,
    NULL, -- user_ids
    (SELECT id FROM profiles WHERE email = 'jonathan.d.d.wood@gmail.com' LIMIT 1), -- requesting_user_id
    'AP' -- requesting_user_role
) LIMIT 10;

-- 6. Show current profiles data
SELECT 
    id,
    email,
    display_name,
    role
FROM profiles
WHERE email LIKE '%test%' OR email LIKE '%jonathan%'
LIMIT 3;

-- 7. Count availability records by user
SELECT 
    p.display_name,
    p.email,
    p.role,
    COUNT(ua.id) as availability_count,
    MIN(ua.effective_date) as earliest_effective,
    MAX(ua.expiry_date) as latest_expiry
FROM profiles p
LEFT JOIN user_availability ua ON p.id = ua.user_id AND ua.is_active = true
GROUP BY p.id, p.display_name, p.email, p.role
HAVING COUNT(ua.id) > 0
ORDER BY availability_count DESC
LIMIT 5;