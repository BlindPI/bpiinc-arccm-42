
export interface EnhancedTeam {
  id: string;
  name: string;
  description?: string;
  location_id?: string;
  provider_id?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  monthly_targets: Record<string, any>;
  current_metrics: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
  location?: {
    id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
  };
  provider?: {
    id: string;
    name: string;
    provider_type: string;
  };
  members?: TeamMemberWithProfile[];
}

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    role: string; // Keep as string to avoid UserRole dependency
    email?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface TeamPerformanceMetric {
  id: string;
  team_id: string;
  location_id?: string;
  metric_type: string;
  metric_value: number;
  metric_period: string;
  recorded_date: string;
  recorded_by: string;
  metadata: Record<string, any>;
}

export interface TeamLocationAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
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
