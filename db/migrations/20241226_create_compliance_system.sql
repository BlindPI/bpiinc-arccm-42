-- Drop existing compliance tables with CASCADE to handle dependencies
DROP TABLE IF EXISTS compliance_activity_log CASCADE;
DROP TABLE IF EXISTS compliance_tier_history CASCADE;
DROP TABLE IF EXISTS user_compliance_records CASCADE;
DROP TABLE IF EXISTS compliance_requirements_templates CASCADE;
DROP TABLE IF EXISTS compliance_requirements CASCADE;
DROP TABLE IF EXISTS compliance_templates CASCADE;
DROP FUNCTION IF EXISTS get_compliance_completion_stats() CASCADE;

-- Add compliance_tier column to profiles if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS compliance_tier VARCHAR(20) DEFAULT 'basic' CHECK (compliance_tier IN ('basic', 'robust'));

-- Create compliance_templates table
CREATE TABLE compliance_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(10) NOT NULL CHECK (role IN ('AP', 'IC', 'IP', 'IT')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'robust')),
    template_name VARCHAR(255) NOT NULL,
    description TEXT,
    ui_config JSONB DEFAULT '{}',
    icon_name VARCHAR(50) DEFAULT 'Award',
    color_scheme VARCHAR(50) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, tier)
);

-- Create compliance_requirements table
CREATE TABLE compliance_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    requirement_type VARCHAR(50) NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    due_days_from_assignment INTEGER DEFAULT 30,
    points_value INTEGER DEFAULT 10,
    document_required BOOLEAN DEFAULT false,
    renewal_frequency_months INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for template requirements
CREATE TABLE compliance_requirements_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES compliance_templates(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    is_mandatory BOOLEAN DEFAULT true,
    custom_due_days INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(template_id, requirement_id)
);

-- Create user_compliance_records table
CREATE TABLE user_compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'expired')),
    submission_data JSONB DEFAULT '{}',
    ui_state JSONB DEFAULT '{}',
    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES profiles(id),
    rejection_reason TEXT,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, requirement_id)
);

-- Create compliance_tier_history table
CREATE TABLE compliance_tier_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    old_tier VARCHAR(20),
    new_tier VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES profiles(id),
    change_reason TEXT,
    requirements_affected INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create compliance_activity_log table
CREATE TABLE compliance_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    requirement_id UUID REFERENCES compliance_requirements(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop existing indexes if they exist, then create them
DROP INDEX IF EXISTS idx_user_compliance_records_user_id;
DROP INDEX IF EXISTS idx_user_compliance_records_status;
DROP INDEX IF EXISTS idx_user_compliance_records_due_date;
DROP INDEX IF EXISTS idx_compliance_tier_history_user_id;
DROP INDEX IF EXISTS idx_compliance_activity_log_user_id;
DROP INDEX IF EXISTS idx_compliance_activity_log_created_at;
DROP INDEX IF EXISTS idx_profiles_compliance_tier;

-- Create indexes for performance
CREATE INDEX idx_user_compliance_records_user_id ON user_compliance_records(user_id);
CREATE INDEX idx_user_compliance_records_status ON user_compliance_records(status);
CREATE INDEX idx_user_compliance_records_due_date ON user_compliance_records(due_date);
CREATE INDEX idx_compliance_tier_history_user_id ON compliance_tier_history(user_id);
CREATE INDEX idx_compliance_activity_log_user_id ON compliance_activity_log(user_id);
CREATE INDEX idx_compliance_activity_log_created_at ON compliance_activity_log(created_at);
CREATE INDEX idx_profiles_compliance_tier ON profiles(compliance_tier) WHERE compliance_tier IS NOT NULL;

-- Insert default compliance templates
INSERT INTO compliance_templates (role, tier, template_name, description, ui_config) VALUES
('AP', 'basic', 'Authorized Provider - Basic', 'Basic compliance requirements for authorized providers', 
 '{"theme_color": "#3B82F6", "icon": "Award", "dashboard_layout": "grid", "welcome_message": "Welcome to your basic compliance dashboard"}'),
('AP', 'robust', 'Authorized Provider - Robust', 'Comprehensive compliance requirements for authorized providers',
 '{"theme_color": "#059669", "icon": "Shield", "dashboard_layout": "list", "welcome_message": "Welcome to your comprehensive compliance dashboard"}'),
('IC', 'basic', 'Instructor Candidate - Basic', 'Basic compliance requirements for instructor candidates',
 '{"theme_color": "#DC2626", "icon": "GraduationCap", "dashboard_layout": "grid", "welcome_message": "Welcome to your instructor candidate dashboard"}'),
('IC', 'robust', 'Instructor Candidate - Robust', 'Comprehensive compliance requirements for instructor candidates',
 '{"theme_color": "#7C2D12", "icon": "BookOpen", "dashboard_layout": "timeline", "welcome_message": "Welcome to your comprehensive instructor dashboard"}'),
('IP', 'basic', 'Instructor Provisional - Basic', 'Basic compliance requirements for provisional instructors',
 '{"theme_color": "#9333EA", "icon": "Users", "dashboard_layout": "grid", "welcome_message": "Welcome to your provisional instructor dashboard"}'),
('IP', 'robust', 'Instructor Provisional - Robust', 'Comprehensive compliance requirements for provisional instructors',
 '{"theme_color": "#581C87", "icon": "Award", "dashboard_layout": "kanban", "welcome_message": "Welcome to your comprehensive instructor dashboard"}'),
('IT', 'basic', 'Instructor Trainer - Basic', 'Basic compliance requirements for instructor trainers',
 '{"theme_color": "#EA580C", "icon": "Crown", "dashboard_layout": "list", "welcome_message": "Welcome to your instructor trainer dashboard"}'),
('IT', 'robust', 'Instructor Trainer - Robust', 'Comprehensive compliance requirements for instructor trainers',
 '{"theme_color": "#9A3412", "icon": "Trophy", "dashboard_layout": "timeline", "welcome_message": "Welcome to your comprehensive trainer dashboard"}');

-- Insert sample compliance requirements
INSERT INTO compliance_requirements (name, description, requirement_type, is_mandatory, due_days_from_assignment, points_value) VALUES
('Initial Application Review', 'Review and approval of initial application documents', 'document_review', true, 30, 15),
('Background Check Completion', 'Complete background check verification', 'verification', true, 45, 20),
('Training Module Completion', 'Complete required training modules', 'training', true, 60, 25),
('Skills Assessment', 'Pass required skills assessment', 'assessment', true, 90, 30),
('Continuing Education Units', 'Complete annual continuing education requirements', 'education', false, 365, 10),
('Quality Assurance Review', 'Participate in quality assurance review process', 'review', false, 120, 15),
('Peer Evaluation', 'Complete peer evaluation process', 'evaluation', false, 180, 20),
('Professional Development', 'Participate in professional development activities', 'development', false, 270, 15);

-- Link requirements to templates (basic tier gets fewer requirements)
-- Basic tier requirements (4-5 requirements each)
INSERT INTO compliance_requirements_templates (template_id, requirement_id, is_mandatory)
SELECT t.id, r.id, true
FROM compliance_templates t, compliance_requirements r
WHERE t.tier = 'basic' AND r.name IN (
    'Initial Application Review',
    'Background Check Completion', 
    'Training Module Completion',
    'Skills Assessment'
);

-- Robust tier gets all requirements
INSERT INTO compliance_requirements_templates (template_id, requirement_id, is_mandatory)
SELECT t.id, r.id, CASE WHEN r.is_mandatory THEN true ELSE false END
FROM compliance_templates t, compliance_requirements r
WHERE t.tier = 'robust';

-- Create function to get compliance completion stats
CREATE OR REPLACE FUNCTION get_compliance_completion_stats()
RETURNS TABLE (
    tier VARCHAR(20),
    total_users BIGINT,
    avg_completion_percentage NUMERIC,
    total_requirements BIGINT,
    completed_requirements BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.compliance_tier as tier,
        COUNT(DISTINCT p.id) as total_users,
        COALESCE(AVG(
            CASE 
                WHEN total_reqs.count > 0 
                THEN (completed_reqs.count::NUMERIC / total_reqs.count::NUMERIC) * 100 
                ELSE 0 
            END
        ), 0) as avg_completion_percentage,
        COALESCE(SUM(total_reqs.count), 0) as total_requirements,
        COALESCE(SUM(completed_reqs.count), 0) as completed_requirements
    FROM profiles p
    LEFT JOIN (
        SELECT 
            ucr.user_id,
            COUNT(*) as count
        FROM user_compliance_records ucr
        GROUP BY ucr.user_id
    ) total_reqs ON p.id = total_reqs.user_id
    LEFT JOIN (
        SELECT 
            ucr.user_id,
            COUNT(*) as count
        FROM user_compliance_records ucr
        WHERE ucr.status = 'approved'
        GROUP BY ucr.user_id
    ) completed_reqs ON p.id = completed_reqs.user_id
    WHERE p.compliance_tier IS NOT NULL
    GROUP BY p.compliance_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update profiles with default compliance tiers based on role
UPDATE profiles 
SET compliance_tier = CASE 
    WHEN role = 'IC' THEN 'robust'  -- Instructor candidates need comprehensive tier
    ELSE 'basic'  -- Others start with basic
END
WHERE compliance_tier IS NULL;

-- Enable RLS on all compliance tables
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_requirements_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compliance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_activity_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Templates and requirements are readable by authenticated users
CREATE POLICY "compliance_templates_read" ON compliance_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "compliance_requirements_read" ON compliance_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "compliance_requirements_templates_read" ON compliance_requirements_templates FOR SELECT TO authenticated USING (true);

-- Users can only see their own compliance records
CREATE POLICY "user_compliance_records_own" ON user_compliance_records 
    FOR ALL TO authenticated USING (auth.uid() = user_id);

-- SA and AD can see all records
CREATE POLICY "user_compliance_records_admin" ON user_compliance_records 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('SA', 'AD')
        )
    );

-- Similar policies for history and activity logs
CREATE POLICY "compliance_tier_history_own" ON compliance_tier_history 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "compliance_tier_history_admin" ON compliance_tier_history 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('SA', 'AD')
        )
    );

CREATE POLICY "compliance_activity_log_own" ON compliance_activity_log 
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "compliance_activity_log_admin" ON compliance_activity_log 
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('SA', 'AD')
        )
    );

-- Grant necessary permissions
GRANT SELECT ON compliance_templates TO authenticated;
GRANT SELECT ON compliance_requirements TO authenticated;
GRANT SELECT ON compliance_requirements_templates TO authenticated;
GRANT ALL ON user_compliance_records TO authenticated;
GRANT ALL ON compliance_tier_history TO authenticated;
GRANT ALL ON compliance_activity_log TO authenticated;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_compliance_completion_stats() TO authenticated;

COMMENT ON TABLE compliance_templates IS 'Defines compliance requirements templates for different roles and tiers';
COMMENT ON TABLE compliance_requirements IS 'Individual compliance requirements that can be assigned to users';
COMMENT ON TABLE user_compliance_records IS 'Tracks individual user compliance with specific requirements';
COMMENT ON TABLE compliance_tier_history IS 'Audit trail of compliance tier changes';
COMMENT ON TABLE compliance_activity_log IS 'General activity log for compliance-related actions';