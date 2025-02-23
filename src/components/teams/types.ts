
export interface Team {
  id: string;
  name: string;
  group_type: string;
  leader_id: string;
  leader?: {
    role: string;
  };
  members?: TeamMemberWithProfile[];
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string;
  email?: string;
  member_id: string;
  team_id: string;
  profiles?: {
    id: string;
    role: string;
  };
}

// This matches the structure returned by our Supabase query
export interface TeamMemberWithProfile {
  member: {
    role: string;
  };
}

export interface ManageTeamDialogProps {
  team: Team;
}
