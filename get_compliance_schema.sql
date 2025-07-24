-- Get compliance_metrics table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compliance_metrics'
ORDER BY ordinal_position;

-- Get user_compliance_records table schema  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_compliance_records'
ORDER BY ordinal_position;

-- Get compliance_documents table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'compliance_documents'
ORDER BY ordinal_position;

-- Get sample compliance_metrics data to understand the relationship
SELECT 
    id,
    name,
    category,
    applicable_tiers,
    is_active
FROM compliance_metrics 
WHERE is_active = true
LIMIT 10;