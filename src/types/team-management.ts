
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity: string; // Make this required to match service interface
  joined_at: string;
  display_name: string;
  profiles: {
    id: string;
    display_name: string;
    email: string;
    role: string;
    created_at: string;
    updated_at: string;
    compliance_status?: boolean | null;
    last_training_date?: string | null;
    next_training_due?: string | null;
    performance_score?: number | null;
    training_hours?: number | null;
    certifications_count?: number | null;
    location_id?: string | null;
    department?: string | null;
    supervisor_id?: string | null;
    user_id?: string;
  };
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score?: number;
  location_id?: string;
  provider_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  monthly_targets?: Record<string, any>;
  current_metrics?: Record<string, any>;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'active' | 'inactive' | 'on_leave' | 'suspended';
  location_assignment?: string | null;
  assignment_start_date?: string | null;
  assignment_end_date?: string | null;
  team_position?: string | null;
  permissions: string[];
  created_at: string;
  updated_at: string;
  last_activity?: string;
}
