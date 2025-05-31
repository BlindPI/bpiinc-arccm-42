
// Re-export the unified types from user-management
export type { Team as EnhancedTeam, TeamMemberWithProfile } from '@/types/user-management';

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

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  location_name: string;
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
