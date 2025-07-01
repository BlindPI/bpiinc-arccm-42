-- =================================================================
-- COMPLIANCE DATABASE SCHEMA VERIFICATION & FIXES
-- =================================================================

-- 1. VERIFY EXISTING TABLES
-- Run this first to see what compliance tables exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name LIKE '%compliance%' 
ORDER BY table_name, ordinal_position;

-- 2. VERIFY USER_COMPLIANCE_RECORDS TABLE
-- Check if table exists and what columns it has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_compliance_records'
ORDER BY ordinal_position;

-- 3. ADD MISSING COMPLIANCE_STATUS COLUMN
-- Fix the main error: column compliance_status does not exist
ALTER TABLE user_compliance_records 
ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'pending';

-- 4. ADD OTHER MISSING COLUMNS FOR COMPLIANCE FUNCTIONALITY
ALTER TABLE user_compliance_records 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'basic';

-- 5. ADD MISSING COLUMNS TO EXISTING COMPLIANCE_METRICS TABLE
ALTER TABLE compliance_metrics
ADD COLUMN IF NOT EXISTS required_for_basic BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS required_for_robust BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 5b. CREATE COMPLIANCE_METRICS TABLE IF NOT EXISTS (fallback)
CREATE TABLE IF NOT EXISTS compliance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    measurement_type VARCHAR(50) NOT NULL,
    description TEXT,
    required_for_basic BOOLEAN DEFAULT FALSE,
    required_for_robust BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE COMPLIANCE_TIERS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS compliance_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    tier VARCHAR(20) NOT NULL DEFAULT 'basic',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_requirements INTEGER DEFAULT 0,
    total_requirements INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE AUTHORIZED_PROVIDERS TABLE IF NOT EXISTS
CREATE TABLE IF NOT EXISTS authorized_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    provider_name VARCHAR(255),
    provider_code VARCHAR(50),
    authorization_level VARCHAR(50) DEFAULT 'basic',
    authorized_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active'
);

-- 8a. ADD UNIQUE CONSTRAINT TO COMPLIANCE_METRICS NAME COLUMN
ALTER TABLE compliance_metrics
ADD CONSTRAINT IF NOT EXISTS compliance_metrics_name_unique UNIQUE (name);

-- 8b. INSERT SAMPLE COMPLIANCE METRICS
INSERT INTO compliance_metrics (name, category, measurement_type, required_for_basic, required_for_robust)
VALUES
('Resume Upload', 'documentation', 'file_upload', TRUE, TRUE),
('Background Check', 'verification', 'document_review', TRUE, TRUE),
('Company Information', 'profile', 'form_completion', TRUE, TRUE),
('Training Completion', 'education', 'course_completion', FALSE, TRUE),
('Certification Upload', 'credentials', 'file_upload', FALSE, TRUE),
('Insurance Documentation', 'legal', 'document_review', FALSE, TRUE),
('Continuing Education', 'education', 'ongoing_tracking', FALSE, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 9. INSERT DEFAULT COMPLIANCE TIERS FOR EXISTING USERS
INSERT INTO compliance_tiers (user_id, tier, total_requirements)
SELECT p.id, 
       CASE 
         WHEN p.role IN ('AP', 'IC') THEN 'robust'
         ELSE 'basic'
       END as tier,
       CASE 
         WHEN p.role IN ('AP', 'IC') THEN 7
         ELSE 3
       END as total_requirements
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM compliance_tiers ct WHERE ct.user_id = p.id
);

-- 10. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_user_id ON user_compliance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_status ON user_compliance_records(compliance_status);
CREATE INDEX IF NOT EXISTS idx_compliance_tiers_user_id ON compliance_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_authorized_providers_user_id ON authorized_providers(user_id);

-- 11. ENABLE ROW LEVEL SECURITY
ALTER TABLE compliance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_providers ENABLE ROW LEVEL SECURITY;

-- 12. CREATE RLS POLICIES
-- Allow authenticated users to read compliance metrics
CREATE POLICY "Users can read compliance metrics" ON compliance_metrics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to read their own compliance tier
CREATE POLICY "Users can read own compliance tier" ON compliance_tiers
    FOR SELECT USING (auth.uid() = user_id);

-- Allow SA/AD to read all compliance tiers
CREATE POLICY "SA/AD can read all compliance tiers" ON compliance_tiers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role IN ('SA', 'AD')
        )
    );

-- Allow users to read their own authorized provider status
CREATE POLICY "Users can read own provider status" ON authorized_providers
    FOR SELECT USING (auth.uid() = user_id);

-- 13. VERIFICATION QUERIES
-- Run these to verify the fixes worked
SELECT 'user_compliance_records columns' as table_info;
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'user_compliance_records';

SELECT 'compliance_metrics count' as table_info;
SELECT COUNT(*) FROM compliance_metrics;

SELECT 'compliance_tiers count' as table_info;
SELECT COUNT(*) FROM compliance_tiers;

SELECT 'Sample compliance data' as table_info;
SELECT u.email, ct.tier, ct.completion_percentage 
FROM compliance_tiers ct
JOIN profiles u ON ct.user_id = u.id
LIMIT 5;