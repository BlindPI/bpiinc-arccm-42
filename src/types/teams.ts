
import type { Database } from "@/integrations/supabase/types";
import type { Profile } from "@/types/courses";

// Enum Types
export type TeamType = Database['public']['Enums']['team_type'];
export type TeamMemberStatus = Database['public']['Enums']['team_member_status'];
export type TeamMemberRole = Database['public']['Tables']['team_members']['Row']['role'];

// Table Types
export type Team = Database['public']['Tables']['teams']['Row'];
export type TeamInsert = Database['public']['Tables']['teams']['Insert'];
export type TeamUpdate = Database['public']['Tables']['teams']['Update'];

// Base type for team members without relations
type BaseTeamMember = Database['public']['Tables']['team_members']['Row'];

// Extended type with profiles relation
export type TeamMember = BaseTeamMember & {
  profiles?: Pick<Profile, 'id' | 'display_name' | 'role'> | null;
};

// Composite Types with Relations
export type TeamWithMembers = Team & {
  team_members?: TeamMember[];
};

// Use this type when we need full details
export type TeamMemberWithDetails = TeamMember & {
  profiles: Profile;
  teams: Team;
};
