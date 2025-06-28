
// Analytics and workflow types

export interface WorkflowApproval {
  id: string;
  workflow_instance_id: string;
  approver_id: string;
  approval_status: string;
  approval_date?: string;
  comments?: string;
  approval_method: string;
  step_number: number;
  created_at: string;
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
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  report_type: string;
  description: string;
  configuration: Record<string, any>;
  schedule_config?: Record<string, any>;
  is_automated: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CacheEntry {
  id: string;
  cache_key: string;
  cache_namespace: string;
  cache_data: Record<string, any>;
  ttl_seconds: number;
  expires_at?: string;
  created_at: string;
  last_accessed: string;
  access_count: number;
}

export interface DashboardMetric {
  id: string;
  metric_type: string;
  metric_label: string;
  current_value: number;
  previous_value?: number;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
  period_start?: string;
  period_end?: string;
  is_active: boolean;
  display_order: number;
}

// New missing types
export interface GlobalAnalytics {
  totalUsers: number;
  activeSessions: number;
  completionRate: number;
  complianceScore: number;
  topPerformingTeams: TeamAnalyticsSummary[];
}

export interface TeamAnalyticsSummary {
  id: string;
  name: string;
  performance: number;
  memberCount: number;
}

export interface TeamGoal {
  id: string;
  title: string;
  progress: number;
  target: number;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementType: string;
  title: string;
  description: string;
  earnedAt: string;
  points?: number;
}

export interface ComplianceProgress {
  userId: string;
  overallProgress: number;
  completedRequirements: number;
  totalRequirements: number;
  tier: 'basic' | 'robust';
  canAdvanceTier: boolean;
  requirements: {
    completed: number;
    total: number;
  };
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  campaign_name: string;
  campaign_type: 'newsletter' | 'promotional' | 'drip' | 'event' | 'follow_up';
  content: string;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  automation_rules: Record<string, any>;
  target_audience: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by: string;
}
