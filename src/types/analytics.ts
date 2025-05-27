
export interface AnalyticsReport {
  id: string;
  name: string;
  report_type: 'certificate_trends' | 'instructor_performance' | 'compliance_overview' | 'custom';
  configuration: Record<string, any>;
  schedule_config?: Record<string, any>;
  is_automated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsCache {
  id: string;
  cache_key: string;
  data: Record<string, any>;
  expires_at: string;
  created_at: string;
}

export interface CertificateTrendData {
  period_start: string;
  total_certificates: number;
  active_certificates: number;
  growth_rate: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: 'progression' | 'notification' | 'compliance' | 'certificate';
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  execution_count: number;
  last_executed?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id: string;
  execution_data: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, any>;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  integration_type: 'webhook' | 'oauth' | 'api_key' | 'custom';
  endpoint_url: string;
  configuration: Record<string, any>;
  authentication_config?: Record<string, any>;
  is_active: boolean;
  rate_limit: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  integration_id: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'failed' | 'retrying';
  response_status?: number;
  response_body?: string;
  retry_count: number;
  next_retry_at?: string;
  created_at: string;
  sent_at?: string;
}

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'INFO';
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  event_data: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface AccessPattern {
  id: string;
  user_id?: string;
  session_id?: string;
  page_path: string;
  action?: string;
  duration_seconds?: number;
  metadata: Record<string, any>;
  created_at: string;
}
