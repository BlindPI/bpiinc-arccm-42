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

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
  last_login?: string;
  is_active?: boolean;
  compliance_status?: boolean;
  compliance_tier?: string;
  department?: string;
  job_title?: string;
  phone?: string;
  status?: string;
  team_count?: number;
  certifications_count?: number;
  compliance_score?: number;
  pending_actions?: number;
  user_id?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  type: 'team' | 'compliance' | 'performance' | 'custom';
  data: any;
  generatedAt: string;
  generatedBy: string;
  parameters: Record<string, any>;
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
}
