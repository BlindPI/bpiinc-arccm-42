
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
