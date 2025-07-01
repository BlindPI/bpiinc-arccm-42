
-- PHASE 1: Database Schema Alignment for Compliance Dashboard

-- Fix 1: Add missing columns to user_compliance_records
ALTER TABLE user_compliance_records 
ADD COLUMN IF NOT EXISTS compliance_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS current_value TEXT,
ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- Fix 2: Add metric_id column if missing (for proper foreign key relationship)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_compliance_records' 
        AND column_name = 'metric_id'
    ) THEN
        ALTER TABLE user_compliance_records 
        ADD COLUMN metric_id UUID REFERENCES compliance_metrics(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Fix 3: Create compliance_tiers table if not exists
CREATE TABLE IF NOT EXISTS compliance_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL DEFAULT 'basic',
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_requirements INTEGER DEFAULT 0,
    total_requirements INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    can_advance_tier BOOLEAN DEFAULT FALSE,
    advancement_blocked_reason TEXT
);

-- Fix 4: Create system_admin_metrics view for dashboard stats
CREATE OR REPLACE VIEW system_admin_metrics AS
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM user_compliance_records WHERE compliance_status = 'pending') as pending_reviews,
    (SELECT COUNT(*) FROM compliance_tiers WHERE tier = 'basic') as basic_tier_count,
    (SELECT COUNT(*) FROM compliance_tiers WHERE tier = 'robust') as robust_tier_count,
    (SELECT ROUND(AVG(completion_percentage), 1) FROM compliance_tiers) as avg_completion_rate;

-- Fix 5: Create function to get pending submissions for review
CREATE OR REPLACE FUNCTION get_pending_compliance_submissions()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    metric_name TEXT,
    submitted_at TIMESTAMPTZ,
    current_value TEXT,
    compliance_status TEXT
) 
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ucr.id,
        ucr.user_id,
        p.display_name as user_name,
        cm.name as metric_name,
        ucr.submitted_at,
        ucr.current_value,
        ucr.compliance_status
    FROM user_compliance_records ucr
    JOIN profiles p ON ucr.user_id = p.id
    JOIN compliance_metrics cm ON ucr.metric_id = cm.id
    WHERE ucr.compliance_status = 'pending'
    ORDER BY ucr.submitted_at DESC;
END;
$$;

-- Fix 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_status ON user_compliance_records(compliance_status);
CREATE INDEX IF NOT EXISTS idx_user_compliance_records_user_metric ON user_compliance_records(user_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tiers_user_id ON compliance_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_tiers_tier ON compliance_tiers(tier);

-- Fix 7: Insert sample data for compliance tiers if empty
INSERT INTO compliance_tiers (user_id, tier, total_requirements, completed_requirements, completion_percentage)
SELECT 
    p.id,
    CASE 
        WHEN p.role IN ('AP', 'IC') THEN 'robust'
        ELSE 'basic'
    END,
    CASE 
        WHEN p.role IN ('AP', 'IC') THEN 7
        ELSE 3
    END,
    0,
    0
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM compliance_tiers ct WHERE ct.user_id = p.id)
ON CONFLICT DO NOTHING;

-- Fix 8: Insert sample compliance metrics if empty
INSERT INTO compliance_metrics (name, category, measurement_type, required_for_roles, is_active)
VALUES
('Resume Upload', 'documentation', 'file_upload', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Background Check', 'verification', 'document_review', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Company Information', 'profile', 'form_completion', ARRAY['IT', 'IP', 'IC', 'AP'], true),
('Training Completion', 'education', 'course_completion', ARRAY['IC', 'AP'], true),
('Certification Upload', 'credentials', 'file_upload', ARRAY['IC', 'AP'], true)
ON CONFLICT (name) DO NOTHING;
