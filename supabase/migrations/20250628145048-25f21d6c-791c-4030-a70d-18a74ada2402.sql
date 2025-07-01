
-- Migration 04: Create compliance audit trail and reporting tables
-- Enterprise-grade audit trail and compliance reporting infrastructure

-- Compliance audit trail for tracking all compliance-related actions
CREATE TABLE IF NOT EXISTS compliance_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance report templates for standardized reporting
CREATE TABLE IF NOT EXISTS compliance_report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    template_type VARCHAR(100) NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    query_config JSONB NOT NULL DEFAULT '{}',
    output_format VARCHAR(50) DEFAULT 'json',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated compliance reports storage
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES compliance_report_templates(id),
    generated_by UUID REFERENCES profiles(id),
    report_name VARCHAR(255) NOT NULL,
    parameters_used JSONB DEFAULT '{}',
    report_data JSONB NOT NULL DEFAULT '{}',
    generation_status VARCHAR(50) DEFAULT 'pending',
    file_path TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Compliance dashboards configuration
CREATE TABLE IF NOT EXISTS compliance_dashboard_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    dashboard_name VARCHAR(255) NOT NULL,
    widget_config JSONB NOT NULL DEFAULT '{}',
    layout_config JSONB NOT NULL DEFAULT '{}',
    refresh_interval INTEGER DEFAULT 300,
    is_default BOOLEAN DEFAULT false,
    is_shared BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System health monitoring for compliance systems
CREATE TABLE IF NOT EXISTS compliance_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component_name VARCHAR(100) NOT NULL,
    health_status VARCHAR(50) NOT NULL,
    metrics JSONB NOT NULL DEFAULT '{}',
    last_check TIMESTAMPTZ DEFAULT NOW(),
    error_details TEXT,
    recovery_actions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_action ON compliance_audit_trail(user_id, action_type, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_resource ON compliance_audit_trail(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON compliance_audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON compliance_report_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_reports_generated_by ON compliance_reports(generated_by, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_status ON compliance_reports(generation_status);
CREATE INDEX IF NOT EXISTS idx_dashboard_configs_user ON compliance_dashboard_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_health_component ON compliance_system_health(component_name, last_check);

-- Enable RLS
ALTER TABLE compliance_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_dashboard_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_system_health ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit trail
CREATE POLICY "SA and AD can view all audit trail" ON compliance_audit_trail
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "Users can view their own audit trail" ON compliance_audit_trail
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit trail" ON compliance_audit_trail
    FOR INSERT WITH CHECK (true);

-- RLS Policies for report templates
CREATE POLICY "SA and AD can manage report templates" ON compliance_report_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "AP can view report templates" ON compliance_report_templates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD', 'AP')
        )
    );

-- RLS Policies for reports
CREATE POLICY "Users can view their reports" ON compliance_reports
    FOR SELECT USING (
        generated_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

CREATE POLICY "Authorized users can generate reports" ON compliance_reports
    FOR INSERT WITH CHECK (
        generated_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD', 'AP')
        )
    );

-- RLS Policies for dashboard configs
CREATE POLICY "Users can manage their dashboard configs" ON compliance_dashboard_configs
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "SA and AD can view all dashboard configs" ON compliance_dashboard_configs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- RLS Policies for system health
CREATE POLICY "SA and AD can manage system health" ON compliance_system_health
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('SA', 'AD')
        )
    );

-- Auto-update triggers
CREATE TRIGGER update_compliance_report_templates_updated_at 
    BEFORE UPDATE ON compliance_report_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_dashboard_configs_updated_at 
    BEFORE UPDATE ON compliance_dashboard_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Cleanup expired reports function
CREATE OR REPLACE FUNCTION cleanup_expired_compliance_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM compliance_reports 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup action
    INSERT INTO compliance_audit_trail (
        user_id,
        action_type,
        resource_type,
        details
    ) VALUES (
        NULL,
        'system_cleanup',
        'compliance_reports',
        jsonb_build_object('deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ language 'plpgsql';
