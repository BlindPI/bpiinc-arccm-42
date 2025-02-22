
import { Profile } from "@/types/user-management";

export interface TeamMemberResponse {
  id: string;
  member_id: string;
  profiles: {
    id: string;
    role: string;
  } | null;
}

export interface TeamMember extends TeamMemberResponse {
  email: string;
}

export interface Team {
  id: string;
  name: string;
  group_type: string;
}

export interface ManageTeamDialogProps {
  team: Team;
}
