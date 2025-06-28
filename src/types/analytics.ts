
export interface RealPerformanceData {
  totalCertificates: number;
  activeSessions: number;
  completionRate: number;
  averageSatisfactionScore: number;
  complianceScore: number;
  performanceRating: number;
  efficiencyRating: number;
}

export interface RealTeamStats {
  totalTeams: number;
  activeMembers: number;
  averagePerformance: number;
  performanceScore: number;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'team' | 'compliance' | 'performance' | 'custom';
  data: any;
  generatedAt: string;
  generatedBy: string;
  parameters: Record<string, any>;
  description?: string;
  report_type?: string;
  is_automated?: boolean;
  configuration?: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'notification' | 'assignment' | 'escalation' | 'report';
  trigger: {
    event: string;
    conditions: Record<string, any>;
  };
  actions: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Database compatibility properties
  rule_type?: string;
  trigger_conditions?: Record<string, any>;
  is_active?: boolean;
  created_by?: string;
  execution_count?: number;
  last_executed?: string;
}

export interface GlobalAnalytics {
  totalUsers: number;
  activeSessions: number;
  completionRate: number;
  complianceScore: number;
  topPerformingTeams: Array<{
    id: string;
    name: string;
    performance: number;
    memberCount: number;
  }>;
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
