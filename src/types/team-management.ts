
export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'active' | 'inactive' | 'pending';
  team_position?: string;
  joined_at: string;
  display_name?: string;
  profiles?: {
    id: string;
    email: string;
    display_name?: string;
    role: string;
    status?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  team_type: string;
  status: 'active' | 'inactive' | 'archived';
  location_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: TeamMemberWithProfile[];
}

export interface TeamCreationData {
  name: string;
  description?: string;
  team_type: string;
  location_id?: string;
  initial_members?: string[];
}
