-- Get compliance_documents table schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compliance_documents'
ORDER BY ordinal_position;

-- Get user_compliance_records table schema (complete)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_compliance_records'
ORDER BY ordinal_position;

-- Get compliance_metrics table schema (complete)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compliance_metrics'
ORDER BY ordinal_position;

-- Get ALL tables with 'compliance' in the name
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%compliance%' 
ORDER BY table_name;