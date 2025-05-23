-- Create missing core tables for dashboard functionality
-- These tables are referenced by existing hooks but don't exist yet

-- Organization metrics table
CREATE TABLE IF NOT EXISTS organization_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization VARCHAR(255) NOT NULL,
    user_count INTEGER NOT NULL DEFAULT 0,
    active_certifications INTEGER NOT NULL DEFAULT 0,
    expiring_certifications INTEGER NOT NULL DEFAULT 0,
    compliance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    revenue_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
    engagement_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certification compliance tracking
CREATE TABLE IF NOT EXISTS certification_compliance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization VARCHAR(255) NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    required_count INTEGER NOT NULL DEFAULT 0,
    compliant_count INTEGER NOT NULL DEFAULT 0,
    compliance_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization, certification_type)
);

-- Provider metrics table
CREATE TABLE IF NOT EXISTS provider_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    active_instructors INTEGER NOT NULL DEFAULT 0,
    total_students INTEGER NOT NULL DEFAULT 0,
    courses_offered INTEGER NOT NULL DEFAULT 0,
    avg_satisfaction NUMERIC(3,2) NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    revenue_ytd NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teaching effectiveness metrics
CREATE TABLE IF NOT EXISTS teaching_effectiveness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL,
    course_id UUID NOT NULL,
    session_id UUID NOT NULL,
    students_enrolled INTEGER NOT NULL DEFAULT 0,
    students_completed INTEGER NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    avg_evaluation_score NUMERIC(3,2) NOT NULL DEFAULT 0,
    teaching_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student evaluations
CREATE TABLE IF NOT EXISTS student_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    instructor_id UUID NOT NULL,
    student_id UUID,
    overall_rating INTEGER NOT NULL,
    knowledge_rating INTEGER NOT NULL,
    delivery_rating INTEGER NOT NULL,
    materials_rating INTEGER NOT NULL,
    comments TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT rating_range CHECK (
        overall_rating BETWEEN 1 AND 5 AND
        knowledge_rating BETWEEN 1 AND 5 AND
        delivery_rating BETWEEN 1 AND 5 AND
        materials_rating BETWEEN 1 AND 5
    )
);

-- Certification maintenance tracking
CREATE TABLE IF NOT EXISTS certification_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL,
    certification_type VARCHAR(100) NOT NULL,
    requirement_type VARCHAR(50) NOT NULL,
    required_amount INTEGER NOT NULL,
    completed_amount INTEGER NOT NULL DEFAULT 0,
    completion_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Career progression tracking
CREATE TABLE IF NOT EXISTS career_progression (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL,
    "current_role" VARCHAR(20) NOT NULL,
    target_role VARCHAR(20) NOT NULL,
    progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
    requirements_total INTEGER NOT NULL DEFAULT 0,
    requirements_completed INTEGER NOT NULL DEFAULT 0,
    estimated_completion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Instructor applications table (referenced in provider dashboard)
CREATE TABLE IF NOT EXISTS instructor_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL,
    applicant_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID,
    notes TEXT
);

-- Course approval requests table (referenced in system admin dashboard)
CREATE TABLE IF NOT EXISTS course_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID,
    notes TEXT
);

-- Certification verification requests table (referenced in admin dashboard)
CREATE TABLE IF NOT EXISTS certification_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL,
    requested_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID,
    verification_notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_metrics_org ON organization_metrics(organization);
CREATE INDEX IF NOT EXISTS idx_certification_compliance_org ON certification_compliance(organization);
CREATE INDEX IF NOT EXISTS idx_provider_metrics_provider ON provider_metrics(provider_id);
CREATE INDEX IF NOT EXISTS idx_teaching_effectiveness_instructor ON teaching_effectiveness(instructor_id);
CREATE INDEX IF NOT EXISTS idx_student_evaluations_instructor ON student_evaluations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_certification_maintenance_instructor ON certification_maintenance(instructor_id);
CREATE INDEX IF NOT EXISTS idx_career_progression_instructor ON career_progression(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_applications_provider ON instructor_applications(provider_id);
CREATE INDEX IF NOT EXISTS idx_course_approval_requests_status ON course_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_certification_verification_requests_status ON certification_verification_requests(status);

-- Insert sample data to prevent empty dashboard errors
INSERT INTO organization_metrics (organization, user_count, active_certifications, expiring_certifications, compliance_rate) 
VALUES 
    ('Default Organization', 0, 0, 0, 100),
    ('Unknown Organization', 0, 0, 0, 100)
ON CONFLICT DO NOTHING;

INSERT INTO certification_compliance (organization, certification_type, required_count, compliant_count, compliance_rate)
VALUES 
    ('Default Organization', 'CPR Certification', 0, 0, 100),
    ('Default Organization', 'First Aid Training', 0, 0, 100),
    ('Unknown Organization', 'CPR Certification', 0, 0, 100),
    ('Unknown Organization', 'First Aid Training', 0, 0, 100)
ON CONFLICT (organization, certification_type) DO NOTHING;