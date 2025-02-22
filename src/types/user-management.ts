
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
