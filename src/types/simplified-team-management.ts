
// Simplified team management types that decouple team roles from system roles

export interface SimpleTeamPermissions {
  can_manage_members: boolean;
  can_edit_settings: boolean;
  can_view_reports: boolean;
}

export interface SimpleTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  permissions: SimpleTeamPermissions;
  team_position?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  created_at: string;
  updated_at: string;
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    role: string; // System role (SA/AD/IC/etc) - separate from team role
    email?: string;
  };
}

export interface SimpleTeam {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'suspended';
  team_type: string;
  performance_score: number;
  location_id?: string;
  provider_id?: string;
  created_at: string;
  updated_at: string;
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  members?: SimpleTeamMember[];
  member_count?: number;
}

// Helper functions for team permissions
export const getTeamPermissions = (role: 'MEMBER' | 'ADMIN'): SimpleTeamPermissions => {
  if (role === 'ADMIN') {
    return {
      can_manage_members: true,
      can_edit_settings: true,
      can_view_reports: true
    };
  }
  
  return {
    can_manage_members: false,
    can_edit_settings: false,
    can_view_reports: true
  };
};

export const canUserManageTeam = (member: SimpleTeamMember): boolean => {
  return member.role === 'ADMIN' || member.permissions.can_manage_members;
};
