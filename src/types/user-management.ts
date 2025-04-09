
import { UserRole } from "@/types/supabase-schema";

export interface Profile {
  id: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
  compliance_status?: boolean;
  email?: string;
}

export interface DocumentSubmission {
  id: string;
  requirement_id: string;
  instructor_id: string;
  document_url: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewer_id: string | null;
  reviewed_at: string | null;
  submitted_at: string;
  feedback: string | null;
  document_requirements: {
    id: string;
    document_type: string;
    from_role: UserRole;
    to_role: UserRole;
    is_mandatory: boolean;
    description: string | null;
  };
}

export interface RoleRequirements {
  id: string;
  from_role: UserRole;
  to_role: UserRole;
  teaching_hours: number;
  completed_teaching_hours: number;
  min_sessions: number;
  completed_sessions: number;
  required_documents: number;
  submitted_documents: number;
  required_videos: number;
  submitted_videos: number;
  time_in_role_days: number;
  min_time_in_role_days: number;
  meets_teaching_requirement: boolean;
  meets_evaluation_requirement: boolean;
  meets_time_requirement: boolean;
  document_compliance: boolean;
  supervisor_evaluations_required: number;
  supervisor_evaluations_completed: number;
}

export interface InvitationResult {
  success: boolean;
  message: string;
  email?: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  initial_role: UserRole;
  invited_by: string;
  invitation_token: string;
  used: boolean;
  created_at: string;
  expires_at: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "MEMBER" | "ADMIN";
  created_at: string;
  updated_at: string;
  profile?: Profile;
  display_name?: string; // Add this to match usage in components
}
