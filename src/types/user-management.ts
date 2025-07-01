
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

// Utility type for safely handling Supabase Json types
export type SafeJson = Record<string, any>;

// Helper function to safely parse Json to Record<string, any>
export function parseJsonToRecord(value: any): Record<string, any> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

// Base team interface with all required properties
export interface Team {
  id: string;
  name: string;
  description?: string | null;
  metadata: SafeJson;
  created_at: string;
  updated_at: string;
  team_type: string;
  status: 'active' | 'inactive' | 'suspended';
  performance_score: number;
  monthly_targets: SafeJson;
  current_metrics: SafeJson;
  location_id?: string;
  provider_id?: string;
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

// Enhanced team interface (same as Team for now to avoid conflicts)
export interface EnhancedTeam extends Team {}

export interface TeamMemberWithProfile {
  id: string;
  team_id: string;
  user_id: string;
  role: "MEMBER" | "ADMIN";
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
  permissions: SafeJson;
  created_at: string;
  updated_at: string;
  display_name: string;
  profile?: {
    id: string;
    display_name: string;
    role: string;
    email?: string;
    created_at: string;
    updated_at: string;
  };
}

// Legacy interface for backward compatibility
export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: "MEMBER" | "ADMIN";
  created_at: string;
  updated_at: string;
  profile?: Profile;
  display_name?: string;
  permissions?: SafeJson;
  location_assignment?: string;
  assignment_start_date?: string;
  assignment_end_date?: string;
  team_position?: string;
}
