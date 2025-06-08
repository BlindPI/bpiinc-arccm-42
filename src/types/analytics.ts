
export interface AnalyticsReport {
  id: string;
  name: string;
  description?: string;
  report_type: 'team_performance' | 'compliance_overview' | 'location_heatmap' | 'cross_team_comparison' | 'custom';
  configuration: Record<string, any>;
  schedule_config?: Record<string, any>;
  is_automated: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportExecution {
  id: string;
  report_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  result_data?: Record<string, any>;
  error_message?: string;
  file_path?: string;
  file_format?: string;
  executed_by: string;
}

export interface ReportSubscription {
  id: string;
  report_id: string;
  user_id: string;
  delivery_method: 'email' | 'download' | 'dashboard';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  delivery_config: Record<string, any>;
  is_active: boolean;
  last_delivered?: string;
  next_delivery?: string;
  created_at: string;
  updated_at: string;
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
  location_name?: string;
}

export interface ComplianceRiskScore {
  id: string;
  entity_type: 'user' | 'team' | 'location';
  entity_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  risk_factors: Record<string, any>;
  mitigation_recommendations: string[];
  last_assessment: string;
  next_assessment_due?: string;
  entity_name?: string;
}

export interface CrossTeamAnalytics {
  id: string;
  analysis_date: string;
  comparison_type: string;
  team_comparisons: Record<string, any>;
  performance_rankings: Record<string, any>;
  improvement_recommendations: string[];
  created_at: string;
}

export interface PredictiveModel {
  id: string;
  model_name: string;
  model_type: string;
  target_metric: string;
  training_data_config: Record<string, any>;
  model_parameters: Record<string, any>;
  accuracy_score?: number;
  last_trained?: string;
  is_active: boolean;
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
