-- File: supabase/migrations/20250624_dual_tier_compliance_system.sql

-- Add compliance tier to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS compliance_tier VARCHAR(20) DEFAULT 'basic' 
CHECK (compliance_tier IN ('basic', 'robust'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_compliance_tier ON profiles(compliance_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_role_tier ON profiles(role, compliance_tier);

-- Compliance templates table
CREATE TABLE IF NOT EXISTS compliance_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(10) NOT NULL CHECK (role IN ('AP', 'IC', 'IP', 'IT')),
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'robust')),
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    requirements_count INTEGER DEFAULT 0,
    total_weight INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    ui_config JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    icon_name VARCHAR(50),
    color_scheme VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, tier)
);

-- Tier assignment history
CREATE TABLE IF NOT EXISTS compliance_tier_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    old_tier VARCHAR(20),
    new_tier VARCHAR(20),
    changed_by UUID REFERENCES profiles(id),
    change_reason TEXT,
    requirements_affected INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced compliance metrics
ALTER TABLE compliance_metrics 
ADD COLUMN IF NOT EXISTS applicable_tiers VARCHAR(50) DEFAULT 'basic,robust',
ADD COLUMN IF NOT EXISTS tier_specific_weight INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS tier_specific_target JSONB DEFAULT NULL;

-- Compliance requirements with UI fields (From Currentplan1.5.md)
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_id UUID REFERENCES compliance_templates(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    requirement_type VARCHAR(50), -- 'document', 'training', 'certification', 'assessment'
    ui_component_type VARCHAR(50), -- 'file_upload', 'form', 'external_link', 'checkbox'
    validation_rules JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT true,
    points_value INTEGER DEFAULT 10,
    due_days_from_assignment INTEGER,
    help_text TEXT,
    auto_approval_rules JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User compliance records with UI state (From Currentplan1.5.md)
CREATE TABLE IF NOT EXISTS user_compliance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'rejected'
    submission_data JSONB DEFAULT '{}',
    ui_state JSONB DEFAULT '{}', -- Stores form state, upload progress, etc.
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    review_data JSONB DEFAULT '{}',
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Additional tables from Currentplan2.md
CREATE TABLE IF NOT EXISTS compliance_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES compliance_requirements(id),
    storage_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    public_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_activity_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    requirement_id UUID REFERENCES compliance_requirements(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_review_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID REFERENCES user_compliance_records(id),
    requirement_id UUID REFERENCES compliance_requirements(id),
    user_id UUID REFERENCES profiles(id),
    reviewer_id UUID REFERENCES profiles(id),
    decision VARCHAR(20) NOT NULL,
    notes TEXT,
    review_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System monitoring tables (From Currentplan3.md)
CREATE TABLE IF NOT EXISTS system_health_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    details JSONB DEFAULT '{}',
    environment VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL,
    details JSONB DEFAULT '{}',
    environment VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX idx_user_compliance_status ON user_compliance_records(user_id, status);
CREATE INDEX idx_compliance_requirements_template ON compliance_requirements(template_id);
CREATE INDEX idx_compliance_req_display_order ON compliance_requirements(template_id, display_order);
CREATE INDEX idx_compliance_files_user_req ON compliance_files(user_id, requirement_id);
CREATE INDEX idx_activity_log_user_time ON compliance_activity_log(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_tier_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_activity_log ENABLE ROW LEVEL SECURITY;

-- Insert template data with full UI configuration (From Currentplan2.md)
INSERT INTO compliance_templates (role, tier, template_name, description, requirements_count, ui_config) VALUES
('IT', 'basic', 'Instructor Trainee - Essential', 'Core onboarding requirements', 3, '{
  "theme_color": "#3B82F6", 
  "icon": "GraduationCap", 
  "dashboard_layout": "grid",
  "welcome_message": "Welcome to your training journey!",
  "progress_visualization": "circular",
  "quick_actions": ["view_training", "upload_document", "contact_mentor"]
}'),
('IT', 'robust', 'Instructor Trainee - Comprehensive', 'Full training pathway', 5, '{
  "theme_color": "#6366F1", 
  "icon": "Award", 
  "dashboard_layout": "kanban",
  "welcome_message": "Advanced training pathway",
  "progress_visualization": "timeline",
  "quick_actions": ["view_assessments", "schedule_evaluation", "view_resources"]
}'),
('IP', 'basic', 'Instructor Provisional - Essential', 'Essential provisional requirements', 3, '{
  "theme_color": "#8B5CF6", 
  "icon": "UserCheck", 
  "dashboard_layout": "list",
  "welcome_message": "Provisional instructor essentials",
  "progress_visualization": "stepped",
  "quick_actions": ["view_requirements", "submit_class_logs", "request_observation"]
}'),
('IP', 'robust', 'Instructor Provisional - Comprehensive', 'Complete provisional certification', 6, '{
  "theme_color": "#7C3AED", 
  "icon": "Shield", 
  "dashboard_layout": "grid",
  "welcome_message": "Path to full certification",
  "progress_visualization": "milestone",
  "quick_actions": ["submit_portfolio", "schedule_review", "view_feedback"]
}'),
('IC', 'basic', 'Instructor Certified - Essential', 'Core certification requirements', 4, '{
  "theme_color": "#059669", 
  "icon": "Award", 
  "dashboard_layout": "grid",
  "welcome_message": "Certified instructor essentials",
  "progress_visualization": "circular",
  "quick_actions": ["manage_certifications", "view_students", "schedule_classes"]
}'),
('IC', 'robust', 'Instructor Certified - Comprehensive', 'Advanced certification pathway', 8, '{
  "theme_color": "#047857", 
  "icon": "ShieldCheck", 
  "dashboard_layout": "timeline",
  "welcome_message": "Advanced instructor capabilities",
  "progress_visualization": "advanced",
  "quick_actions": ["create_courses", "mentor_instructors", "evaluation_committee"]
}'),
('AP', 'basic', 'Authorized Provider - Essential', 'Quick onboarding for providers', 3, '{
  "theme_color": "#DC2626", 
  "icon": "Building", 
  "dashboard_layout": "list",
  "welcome_message": "Provider essentials",
  "progress_visualization": "simple",
  "quick_actions": ["manage_facility", "instructor_roster", "compliance_reports"]
}'),
('AP', 'robust', 'Authorized Provider - Comprehensive', 'Full provider compliance', 7, '{
  "theme_color": "#B91C1C", 
  "icon": "Shield", 
  "dashboard_layout": "grid",
  "welcome_message": "Comprehensive provider management",
  "progress_visualization": "detailed",
  "quick_actions": ["advanced_reporting", "quality_management", "instructor_development"]
}')
ON CONFLICT (role, tier) DO UPDATE SET
    template_name = EXCLUDED.template_name,
    description = EXCLUDED.description,
    requirements_count = EXCLUDED.requirements_count,
    ui_config = EXCLUDED.ui_config;

-- Database functions (From Currentplan3.md)
CREATE OR REPLACE FUNCTION get_user_role_statistics()
RETURNS TABLE(
    total_users INTEGER,
    role_counts JSONB,
    invalid_role_count INTEGER,
    missing_role_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_users,
        jsonb_object_agg(role, role_count) as role_counts,
        SUM(CASE WHEN role NOT IN ('IT', 'IP', 'IC', 'AP') THEN 1 ELSE 0 END)::INTEGER as invalid_role_count,
        SUM(CASE WHEN role IS NULL THEN 1 ELSE 0 END)::INTEGER as missing_role_count
    FROM (
        SELECT role, COUNT(*) as role_count
        FROM profiles
        GROUP BY role
    ) role_summary;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_tier_assignment_statistics()
RETURNS TABLE(
    tier_counts JSONB,
    missing_tier_count INTEGER,
    invalid_tier_count INTEGER,
    role_tier_breakdown JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_object_agg(compliance_tier, tier_count) as tier_counts,
        SUM(CASE WHEN compliance_tier IS NULL THEN 1 ELSE 0 END)::INTEGER as missing_tier_count,
        SUM(CASE WHEN compliance_tier NOT IN ('basic', 'robust') THEN 1 ELSE 0 END)::INTEGER as invalid_tier_count,
        jsonb_object_agg(role || '_' || COALESCE(compliance_tier, 'null'), role_tier_count) as role_tier_breakdown
    FROM (
        SELECT 
            compliance_tier, 
            COUNT(*) as tier_count,
            role,
            COUNT(*) as role_tier_count
        FROM profiles
        GROUP BY compliance_tier, role
    ) tier_summary;
END;
$$ LANGUAGE plpgsql;