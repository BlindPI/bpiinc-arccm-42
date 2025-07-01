-- CRITICAL FIX: Add missing current_value column
-- This column is required by the application but missing from the database

ALTER TABLE user_compliance_records 
ADD COLUMN IF NOT EXISTS current_value TEXT;

-- Verify the fix
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_compliance_records' 
AND column_name = 'current_value';