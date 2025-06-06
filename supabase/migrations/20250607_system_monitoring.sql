-- System Monitoring Infrastructure
-- This migration creates the core tables needed for system health monitoring and alerting

-- System Health Checks Table
CREATE TABLE IF NOT EXISTS system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('HEALTHY', 'WARNING', 'CRITICAL')),
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('INFO', 'WARNING', 'ERROR', 'CRITICAL')),
  message TEXT NOT NULL,
  source_service TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Activity Logs Table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Performance Logs Table
CREATE TABLE IF NOT EXISTS system_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  response_time_ms INTEGER NOT NULL,
  status_code INTEGER,
  error_message TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alert Configurations Table
CREATE TABLE IF NOT EXISTS alert_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_name TEXT NOT NULL UNIQUE,
  alert_type TEXT NOT NULL,
  threshold_value NUMERIC,
  threshold_operator TEXT CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  check_interval_minutes INTEGER DEFAULT 5,
  enabled BOOLEAN DEFAULT TRUE,
  notification_channels JSONB DEFAULT '[]',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled Reports Table
CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL,
  schedule_cron TEXT NOT NULL,
  recipients JSONB NOT NULL DEFAULT '[]',
  parameters JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,
  last_generated TIMESTAMPTZ,
  next_generation TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Generation History Table
CREATE TABLE IF NOT EXISTS report_generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  generation_status TEXT CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  file_path TEXT,
  file_size_bytes INTEGER,
  generation_time_ms INTEGER,
  error_message TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_health_checks_service ON system_health_checks(service_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_status ON system_health_checks(status);
CREATE INDEX IF NOT EXISTS idx_system_health_checks_last_check ON system_health_checks(last_check_at);

CREATE INDEX IF NOT EXISTS idx_system_alerts_resolved ON system_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_source_service ON system_alerts(source_service);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON performance_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_timestamp ON user_activity_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_system_performance_logs_endpoint ON system_performance_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_system_performance_logs_timestamp ON system_performance_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_system_performance_logs_response_time ON system_performance_logs(response_time_ms);

CREATE INDEX IF NOT EXISTS idx_alert_configurations_enabled ON alert_configurations(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_enabled ON scheduled_reports(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_generation ON scheduled_reports(next_generation);

-- Create RLS policies for security
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for System Admin and Authorized Provider access
CREATE POLICY "System admins can view all health checks" ON system_health_checks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System admins can manage health checks" ON system_health_checks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

CREATE POLICY "System admins can view all alerts" ON system_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System admins can manage alerts" ON system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

CREATE POLICY "System admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System admins can manage performance metrics" ON performance_metrics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

-- Users can view their own activity logs
CREATE POLICY "Users can view own activity logs" ON user_activity_logs
  FOR SELECT USING (user_id = auth.uid());

-- System admins can view all activity logs
CREATE POLICY "System admins can view all activity logs" ON user_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System can insert activity logs" ON user_activity_logs
  FOR INSERT WITH CHECK (true);

-- System performance logs - SA only
CREATE POLICY "System admins can view performance logs" ON system_performance_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

CREATE POLICY "System can insert performance logs" ON system_performance_logs
  FOR INSERT WITH CHECK (true);

-- Alert configurations - SA only
CREATE POLICY "System admins can manage alert configurations" ON alert_configurations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

-- Scheduled reports - SA and AP can view, SA can manage
CREATE POLICY "Authorized users can view scheduled reports" ON scheduled_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System admins can manage scheduled reports" ON scheduled_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'SA'
    )
  );

-- Report generation history - SA and AP can view
CREATE POLICY "Authorized users can view report history" ON report_generation_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('SA', 'AP')
    )
  );

CREATE POLICY "System can manage report history" ON report_generation_history
  FOR ALL WITH CHECK (true);

-- Create functions for automated tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_system_health_checks_updated_at 
  BEFORE UPDATE ON system_health_checks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at 
  BEFORE UPDATE ON system_alerts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_configurations_updated_at 
  BEFORE UPDATE ON alert_configurations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_reports_updated_at 
  BEFORE UPDATE ON scheduled_reports 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default alert configurations
INSERT INTO alert_configurations (alert_name, alert_type, threshold_value, threshold_operator, check_interval_minutes, notification_channels) VALUES
  ('High Response Time', 'response_time', 2000, '>', 5, '["email", "dashboard"]'),
  ('Low System Uptime', 'uptime', 95, '<', 1, '["email", "dashboard", "sms"]'),
  ('High Error Rate', 'error_rate', 5, '>', 5, '["email", "dashboard"]'),
  ('Low Compliance Rate', 'compliance', 70, '<', 60, '["email", "dashboard"]'),
  ('Database Connection Issues', 'database_health', 1, '<', 1, '["email", "dashboard", "sms"]')
ON CONFLICT (alert_name) DO NOTHING;

-- Create a view for system health overview
CREATE OR REPLACE VIEW system_health_overview AS
SELECT 
  service_name,
  status,
  response_time_ms,
  last_check_at,
  CASE 
    WHEN last_check_at > NOW() - INTERVAL '5 minutes' THEN 'current'
    WHEN last_check_at > NOW() - INTERVAL '15 minutes' THEN 'stale'
    ELSE 'outdated'
  END as data_freshness
FROM system_health_checks
WHERE last_check_at = (
  SELECT MAX(last_check_at) 
  FROM system_health_checks shc2 
  WHERE shc2.service_name = system_health_checks.service_name
)
ORDER BY service_name;

-- Create a view for active alerts summary
CREATE OR REPLACE VIEW active_alerts_summary AS
SELECT 
  type,
  COUNT(*) as alert_count,
  MIN(created_at) as oldest_alert,
  MAX(created_at) as newest_alert
FROM system_alerts 
WHERE resolved = false
GROUP BY type
ORDER BY 
  CASE type 
    WHEN 'CRITICAL' THEN 1
    WHEN 'ERROR' THEN 2
    WHEN 'WARNING' THEN 3
    WHEN 'INFO' THEN 4
  END;

COMMENT ON TABLE system_health_checks IS 'Stores system health check results for monitoring service availability and performance';
COMMENT ON TABLE system_alerts IS 'Stores system alerts and notifications for operational issues';
COMMENT ON TABLE performance_metrics IS 'Stores various performance metrics for system monitoring and analysis';
COMMENT ON TABLE user_activity_logs IS 'Tracks user actions for audit and analytics purposes';
COMMENT ON TABLE system_performance_logs IS 'Logs API endpoint performance for monitoring and optimization';
COMMENT ON TABLE alert_configurations IS 'Configures automated alert thresholds and notification settings';
COMMENT ON TABLE scheduled_reports IS 'Manages scheduled report generation and delivery';
COMMENT ON TABLE report_generation_history IS 'Tracks the history of report generation attempts and results';