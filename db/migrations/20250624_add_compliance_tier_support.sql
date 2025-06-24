-- Add compliance tier column to profiles table
ALTER TABLE profiles 
ADD COLUMN compliance_tier VARCHAR(20) DEFAULT 'basic' 
CHECK (compliance_tier IN ('basic', 'robust'));

-- Add index for performance
CREATE INDEX idx_profiles_compliance_tier ON profiles(compliance_tier);

-- Add metadata for compliance templates
CREATE TABLE IF NOT EXISTS compliance_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(10) NOT NULL,
    tier VARCHAR(20) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(role, tier)
);

-- Create index for template lookups
CREATE INDEX idx_compliance_templates_role_tier ON compliance_templates(role, tier);

-- Add tier information to compliance_metrics if needed
ALTER TABLE compliance_metrics 
ADD COLUMN applicable_tiers VARCHAR(50) DEFAULT 'basic,robust';

-- Update RLS policies if needed
CREATE POLICY "Users can view their compliance tier" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage compliance tiers" ON profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('SA', 'AD')
  )
);

-- Insert basic template metadata
INSERT INTO compliance_templates (role, tier, template_name, description) VALUES
('AP', 'basic', 'Authorized Provider - Basic', 'Essential onboarding requirements'),
('AP', 'robust', 'Authorized Provider - Comprehensive', 'Full compliance requirements'),
('IC', 'basic', 'Instructor Certified - Basic', 'Essential certification requirements'),
('IC', 'robust', 'Instructor Certified - Comprehensive', 'Full professional requirements'),
('IP', 'basic', 'Instructor Provisional - Basic', 'Essential provisional requirements'),
('IP', 'robust', 'Instructor Provisional - Comprehensive', 'Full provisional requirements'),
('IT', 'basic', 'Instructor Trainee - Basic', 'Essential onboarding requirements'),
('IT', 'robust', 'Instructor Trainee - Comprehensive', 'Full training requirements');