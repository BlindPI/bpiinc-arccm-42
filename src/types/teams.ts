
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "@/types/courses";

// Enum Types
export type TeamType = Database['public']['Enums']['team_type'];
export type TeamMemberStatus = Database['public']['Enums']['team_member_status'];
export type TeamMemberRole = Database['public']['Enums']['team_member_role'];

// Table Types
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];

export type TeamMember = Database['public']['Tables']['team_members']['Row'] & {
  profiles?: Profile;
};

// Composite Types with Relations
export type TeamWithMembers = Team & {
  team_members?: TeamMember[];
};

export type TeamMemberWithDetails = TeamMember & {
  profiles: Profile;
  teams: Team;
};
