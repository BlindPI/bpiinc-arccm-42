
// Analytics Types aligned with Supabase database schema

export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  report_type: 'team_performance' | 'compliance_overview' | 'location_heatmap' | 'cross_team_comparison' | 'custom';
  configuration: Record<string, any>;
  is_automated: boolean;
  schedule_config?: Record<string, any>;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: string;
  report_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  executed_by: string;
  result_data?: Record<string, any>;
  file_path?: string;
  file_format?: string;
  error_message?: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  rule_type: string;
  trigger_conditions: Record<string, any>;
  actions: Record<string, any>;
  is_active: boolean;
  execution_count: number;
  last_executed?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationExecution {
  id: string;
  rule_id?: string;
  execution_data: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result?: Record<string, any>;
  error_message?: string;
}

export interface ApiIntegration {
  id: string;
  name: string;
  integration_type: string;
  endpoint_url: string;
  is_active: boolean;
  configuration: Record<string, any>;
  authentication_config?: Record<string, any>;
  rate_limit?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  step_number: number;
  approver_id: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  workflow_instance?: {
    id: string;
    instance_name: string;
    entity_type: string;
    entity_id: string;
    workflow_status: string;
    initiated_by: string;
    initiated_at: string;
  };
}

// Executive Dashboard Types
export interface ExecutiveDashboardData {
  totalTeams: number;
  activeMembers: number;
  complianceScore: number;
  performanceIndex: number;
  topPerformingTeams: TeamPerformanceMetrics[];
  riskAlerts: ComplianceRiskScore[];
  recentTrends: any[];
  locationHeatmap: LocationHeatmapData[];
}

export interface TeamPerformanceMetrics {
  id: string;
  team_id: string;
  metric_period_start: string;
  metric_period_end: string;
  certificates_issued: number;
  courses_conducted: number;
  average_satisfaction_score: number;
  compliance_score: number;
  member_retention_rate: number;
  training_hours_delivered: number;
  calculated_at: string;
}

export interface LocationHeatmapData {
  id: string;
  location_id: string;
  analysis_period_start: string;
  analysis_period_end: string;
  performance_score: number;
  activity_density: number;
  compliance_rating: number;
  risk_factors: string[];
  heat_intensity: number;
  location_name: string;
}

export interface ComplianceRiskScore {
  id: string;
  entity_type: string;
  entity_id: string;
  risk_score: number;
  risk_level: string;
  risk_factors: Record<string, any>;
  mitigation_recommendations: string[];
  last_assessment: string;
  entity_name: string;
}

export interface AutomationAction {
  id: string;
  type: string;
  parameters: Record<string, any>;
  condition?: Record<string, any>;
}
