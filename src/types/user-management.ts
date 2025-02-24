import { UserRole } from "@/lib/roles";
import { Json } from "@/integrations/supabase/types";

export interface SystemSettings {
  key: string;
  value: {
    enabled: boolean;
  };
}

export interface RoleTransitionRequest {
  id: string;
  status: string;
}

export interface TestUserCredentials {
  email: string;
  password: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  role_transition_requests?: RoleTransitionRequest[];
  is_test_data?: boolean;
  display_name?: string;
  credentials?: TestUserCredentials;
  compliance_status?: boolean;
  compliance_notes?: string;
  last_compliance_check?: string;
}

export interface SupabaseSystemSettings {
  id: string;
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequirement {
  id: string;
  document_type: string;
  is_mandatory: boolean;
}

export interface DocumentSubmission {
  id: string;
  status: string;
  document_url: string;
  feedback_text?: string;
  expiry_date?: string;
  document_requirements: DocumentRequirement;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  created_at: string | null;
  updated_at: string | null;
  profile: Profile | null;
  display_name: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  metadata: {
    color?: string;
    icon?: string;
    visibility?: 'public' | 'private';
  } | null;
  created_at: string;
  updated_at: string;
}
