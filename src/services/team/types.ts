
// Export the unified types from teamManagementService
export type { 
  Team, 
  EnhancedTeam, 
  TeamMember, 
  TeamMemberWithProfile,
  TeamLocationAssignment,
  TeamPerformanceMetrics,
  TeamAnalytics,
  CreateTeamRequest
} from './teamManagementService';

export interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  location_id?: string;
  metric_type: string;
  metric_value: number;
  period_start: string;
  period_end: string;
  recorded_date: string;
  recorded_by: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ProviderTeamAssignment {
  id: string;
  provider_id: string;
  team_id: string;
  assignment_role: string;
  oversight_level: 'none' | 'monitor' | 'manage' | 'admin';
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'inactive' | 'suspended';
  team_name?: string;
  team_location?: string;
}
