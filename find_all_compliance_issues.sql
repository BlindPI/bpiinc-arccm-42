-- Find all database functions that reference compliance
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%compliance%'
   OR routine_name ILIKE '%compliance%'
ORDER BY routine_name;

-- Find all functions that reference verified_by in user_compliance_records context
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_definition ILIKE '%verified_by%'
   AND routine_definition ILIKE '%user_compliance_records%'
ORDER BY routine_name;

-- Find specific verify_compliance_document function
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'verify_compliance_document';

-- Show ALL RPC functions that could be called from frontend
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_type = 'FUNCTION'
  AND routine_name ILIKE '%compliance%'
ORDER BY routine_name;