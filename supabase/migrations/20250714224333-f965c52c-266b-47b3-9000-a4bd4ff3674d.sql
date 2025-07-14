-- First check the current rosters table structure
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('rosters', 'student_rosters') 
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;