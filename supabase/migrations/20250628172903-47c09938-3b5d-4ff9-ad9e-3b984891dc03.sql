
-- First, let's check the current notification_templates table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notification_templates' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the table doesn't exist, let's create it with the proper structure
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content_text TEXT NOT NULL,
    content_html TEXT,
    variables TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    delivery_channels TEXT[] DEFAULT '["in_app"]',
    role_restrictions TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "SA and AD can manage notification templates" ON notification_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "All authenticated users can view active templates" ON notification_templates
    FOR SELECT USING (is_active = true);
