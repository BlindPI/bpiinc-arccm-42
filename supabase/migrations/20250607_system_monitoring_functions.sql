-- System Monitoring Database Functions
-- This migration creates the RPC functions needed by the SystemHealthService

-- Function to create system alerts
CREATE OR REPLACE FUNCTION create_system_alert(
  alert_type TEXT,
  alert_message TEXT,
  source_service TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_id UUID;
BEGIN
  INSERT INTO system_alerts (type, message, source_service, resolved)
  VALUES (alert_type, alert_message, source_service, false)
  RETURNING id INTO alert_id;
  
  RETURN alert_id;
END;
$$;

-- Function to resolve system alerts
CREATE OR REPLACE FUNCTION resolve_system_alert(
  alert_id UUID,
  resolved_by_user UUID,
  resolution_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE system_alerts 
  SET 
    resolved = true,
    resolved_by = resolved_by_user,
    resolved_at = NOW(),
    resolution_notes = resolution_notes,
    updated_at = NOW()
  WHERE id = alert_id;
  
  RETURN FOUND;
END;
$$;

-- Function to get active alerts
CREATE OR REPLACE FUNCTION get_active_alerts()
RETURNS TABLE (
  id UUID,
  type TEXT,
  message TEXT,
  source_service TEXT,
  resolved BOOLEAN,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.id,
    sa.type,
    sa.message,
    sa.source_service,
    sa.resolved,
    sa.resolved_by,
    sa.resolved_at,
    sa.resolution_notes,
    sa.created_at
  FROM system_alerts sa
  WHERE sa.resolved = false
  ORDER BY sa.created_at DESC;
END;
$$;

-- Function to get active alerts count
CREATE OR REPLACE FUNCTION get_active_alerts_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO alert_count
  FROM system_alerts
  WHERE resolved = false;
  
  RETURN COALESCE(alert_count, 0);
END;
$$;

-- Function to record health checks
CREATE OR REPLACE FUNCTION record_health_check(
  service_name TEXT,
  health_status TEXT,
  response_time_ms INTEGER,
  check_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  check_id UUID;
BEGIN
  INSERT INTO system_health_checks (service_name, status, response_time_ms, details)
  VALUES (service_name, health_status, response_time_ms, check_details)
  RETURNING id INTO check_id;
  
  RETURN check_id;
END;
$$;

-- Function to get system uptime
CREATE OR REPLACE FUNCTION get_system_uptime(hours_back INTEGER DEFAULT 24)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uptime_percentage NUMERIC;
  total_checks INTEGER;
  healthy_checks INTEGER;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'HEALTHY' THEN 1 END) as healthy
  INTO total_checks, healthy_checks
  FROM system_health_checks
  WHERE 
    service_name = 'database' 
    AND last_check_at >= NOW() - (hours_back || ' hours')::INTERVAL;
  
  IF total_checks = 0 THEN
    RETURN 99.5; -- Default uptime if no checks
  END IF;
  
  uptime_percentage := (healthy_checks::NUMERIC / total_checks::NUMERIC) * 100;
  
  RETURN ROUND(uptime_percentage, 1);
END;
$$;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION record_performance_metric(
  metric_type TEXT,
  metric_value NUMERIC,
  metadata JSONB DEFAULT NULL,
  recorded_by_user UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metric_id UUID;
BEGIN
  INSERT INTO performance_metrics (metric_type, metric_value, metadata, recorded_by)
  VALUES (metric_type, metric_value, metadata, recorded_by_user)
  RETURNING id INTO metric_id;
  
  RETURN metric_id;
END;
$$;

-- Function to get performance metrics
CREATE OR REPLACE FUNCTION get_performance_metrics(
  metric_type TEXT,
  hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  id UUID,
  metric_type TEXT,
  metric_value NUMERIC,
  metadata JSONB,
  recorded_at TIMESTAMPTZ,
  recorded_by UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pm.id,
    pm.metric_type,
    pm.metric_value,
    pm.metadata,
    pm.recorded_at,
    pm.recorded_by
  FROM performance_metrics pm
  WHERE 
    pm.metric_type = get_performance_metrics.metric_type
    AND pm.recorded_at >= NOW() - (hours_back || ' hours')::INTERVAL
  ORDER BY pm.recorded_at DESC;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_id UUID,
  action_name TEXT,
  resource_type TEXT DEFAULT NULL,
  resource_id TEXT DEFAULT NULL,
  ip_address INET DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity_logs (
    user_id, action, resource_type, resource_id, 
    ip_address, user_agent, session_id
  )
  VALUES (
    user_id, action_name, resource_type, resource_id,
    ip_address, user_agent, session_id
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Function to get user activity
CREATE OR REPLACE FUNCTION get_user_activity(
  target_user_id UUID DEFAULT NULL,
  hours_back INTEGER DEFAULT 24,
  max_records INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  action TEXT,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ual.id,
    ual.user_id,
    ual.action,
    ual.resource_type,
    ual.resource_id,
    ual.ip_address,
    ual.user_agent,
    ual.session_id,
    ual.timestamp
  FROM user_activity_logs ual
  WHERE 
    (target_user_id IS NULL OR ual.user_id = target_user_id)
    AND ual.timestamp >= NOW() - (hours_back || ' hours')::INTERVAL
  ORDER BY ual.timestamp DESC
  LIMIT max_records;
END;
$$;

-- Function to record API performance
CREATE OR REPLACE FUNCTION record_api_performance(
  endpoint_path TEXT,
  http_method TEXT,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT DEFAULT NULL,
  request_size_bytes INTEGER DEFAULT NULL,
  response_size_bytes INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO system_performance_logs (
    endpoint, method, response_time_ms, status_code,
    error_message, request_size_bytes, response_size_bytes
  )
  VALUES (
    endpoint_path, http_method, response_time_ms, status_code,
    error_message, request_size_bytes, response_size_bytes
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to get API performance metrics
CREATE OR REPLACE FUNCTION get_api_performance_metrics(
  endpoint_filter TEXT DEFAULT NULL,
  hours_back INTEGER DEFAULT 24,
  max_records INTEGER DEFAULT 1000
)
RETURNS TABLE (
  id UUID,
  endpoint TEXT,
  method TEXT,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,
  timestamp TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    spl.id,
    spl.endpoint,
    spl.method,
    spl.response_time_ms,
    spl.status_code,
    spl.error_message,
    spl.request_size_bytes,
    spl.response_size_bytes,
    spl.timestamp
  FROM system_performance_logs spl
  WHERE 
    (endpoint_filter IS NULL OR spl.endpoint ILIKE '%' || endpoint_filter || '%')
    AND spl.timestamp >= NOW() - (hours_back || ' hours')::INTERVAL
  ORDER BY spl.timestamp DESC
  LIMIT max_records;
END;
$$;

-- Function to get system health overview
CREATE OR REPLACE FUNCTION get_system_health_overview()
RETURNS TABLE (
  service_name TEXT,
  status TEXT,
  response_time_ms INTEGER,
  last_check_at TIMESTAMPTZ,
  data_freshness TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM system_health_overview;
END;
$$;

-- Function to get alert statistics
CREATE OR REPLACE FUNCTION get_alert_statistics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  total_alerts INTEGER,
  resolved_alerts INTEGER,
  pending_alerts INTEGER,
  critical_alerts INTEGER,
  warning_alerts INTEGER,
  error_alerts INTEGER,
  info_alerts INTEGER,
  avg_resolution_time_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats RECORD;
BEGIN
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved,
    COUNT(CASE WHEN resolved = false THEN 1 END) as pending,
    COUNT(CASE WHEN type = 'CRITICAL' THEN 1 END) as critical,
    COUNT(CASE WHEN type = 'WARNING' THEN 1 END) as warning,
    COUNT(CASE WHEN type = 'ERROR' THEN 1 END) as error,
    COUNT(CASE WHEN type = 'INFO' THEN 1 END) as info,
    AVG(
      CASE 
        WHEN resolved = true AND resolved_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 
      END
    ) as avg_resolution_hours
  INTO stats
  FROM system_alerts
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL;
  
  RETURN QUERY
  SELECT 
    COALESCE(stats.total, 0)::INTEGER,
    COALESCE(stats.resolved, 0)::INTEGER,
    COALESCE(stats.pending, 0)::INTEGER,
    COALESCE(stats.critical, 0)::INTEGER,
    COALESCE(stats.warning, 0)::INTEGER,
    COALESCE(stats.error, 0)::INTEGER,
    COALESCE(stats.info, 0)::INTEGER,
    ROUND(COALESCE(stats.avg_resolution_hours, 0), 2);
END;
$$;

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data(days_to_keep INTEGER DEFAULT 30)
RETURNS TABLE (
  health_checks_deleted INTEGER,
  performance_logs_deleted INTEGER,
  activity_logs_deleted INTEGER,
  resolved_alerts_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_deleted INTEGER;
  perf_deleted INTEGER;
  activity_deleted INTEGER;
  alerts_deleted INTEGER;
  cutoff_date TIMESTAMPTZ;
BEGIN
  cutoff_date := NOW() - (days_to_keep || ' days')::INTERVAL;
  
  -- Delete old health checks
  DELETE FROM system_health_checks 
  WHERE created_at < cutoff_date;
  GET DIAGNOSTICS health_deleted = ROW_COUNT;
  
  -- Delete old performance logs
  DELETE FROM system_performance_logs 
  WHERE created_at < cutoff_date;
  GET DIAGNOSTICS perf_deleted = ROW_COUNT;
  
  -- Delete old activity logs (keep longer for audit purposes)
  DELETE FROM user_activity_logs 
  WHERE created_at < (NOW() - (days_to_keep * 2 || ' days')::INTERVAL);
  GET DIAGNOSTICS activity_deleted = ROW_COUNT;
  
  -- Delete old resolved alerts
  DELETE FROM system_alerts 
  WHERE resolved = true AND resolved_at < cutoff_date;
  GET DIAGNOSTICS alerts_deleted = ROW_COUNT;
  
  RETURN QUERY
  SELECT health_deleted, perf_deleted, activity_deleted, alerts_deleted;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_system_alert TO authenticated;
GRANT EXECUTE ON FUNCTION resolve_system_alert TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_alerts_count TO authenticated;
GRANT EXECUTE ON FUNCTION record_health_check TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_uptime TO authenticated;
GRANT EXECUTE ON FUNCTION record_performance_metric TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION record_api_performance TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_performance_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION get_system_health_overview TO authenticated;
GRANT EXECUTE ON FUNCTION get_alert_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_monitoring_data TO authenticated;

-- Create a scheduled job to cleanup old data (if pg_cron is available)
-- This would typically be set up by a database administrator
-- SELECT cron.schedule('cleanup-monitoring-data', '0 2 * * *', 'SELECT cleanup_monitoring_data(30);');

COMMENT ON FUNCTION create_system_alert IS 'Creates a new system alert with the specified type and message';
COMMENT ON FUNCTION resolve_system_alert IS 'Marks a system alert as resolved with optional resolution notes';
COMMENT ON FUNCTION get_active_alerts IS 'Returns all unresolved system alerts';
COMMENT ON FUNCTION get_active_alerts_count IS 'Returns the count of unresolved system alerts';
COMMENT ON FUNCTION record_health_check IS 'Records a system health check result';
COMMENT ON FUNCTION get_system_uptime IS 'Calculates system uptime percentage over the specified time period';
COMMENT ON FUNCTION record_performance_metric IS 'Records a performance metric value';
COMMENT ON FUNCTION get_performance_metrics IS 'Retrieves performance metrics for a specific type and time range';
COMMENT ON FUNCTION log_user_activity IS 'Logs user activity for audit and analytics purposes';
COMMENT ON FUNCTION get_user_activity IS 'Retrieves user activity logs with optional filtering';
COMMENT ON FUNCTION record_api_performance IS 'Records API endpoint performance metrics';
COMMENT ON FUNCTION get_api_performance_metrics IS 'Retrieves API performance metrics with optional filtering';
COMMENT ON FUNCTION get_system_health_overview IS 'Returns current system health status for all services';
COMMENT ON FUNCTION get_alert_statistics IS 'Returns comprehensive alert statistics for the specified time period';
COMMENT ON FUNCTION cleanup_monitoring_data IS 'Removes old monitoring data to maintain database performance';