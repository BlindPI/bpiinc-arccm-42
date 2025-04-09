
import { UserRole } from "@/lib/roles";

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string | null;
  created_at: string;
  updated_at: string;
  compliance_status?: boolean;
  last_check_date?: string | null;
}

export interface ProfileInsert extends Omit<Profile, 'id' | 'created_at' | 'updated_at'> {}

export interface Supervision {
  id: string;
  supervisor_id: string;
  supervisee_id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REQUESTED';
  supervisor_name?: string;
  supervisor_role?: UserRole;
  supervisee_name?: string;
  supervisee_role?: UserRole;
  created_at: string;
  updated_at: string;
}

export interface SupervisionInsert extends Omit<Supervision, 'id' | 'created_at' | 'updated_at'> {}

export interface RoleTransitionRequest {
  id: string;
  user_id: string;
  from_role: UserRole;
  to_role: UserRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  profiles?: {
    role: UserRole;
  };
}

export interface RoleTransitionRequestInsert extends Omit<RoleTransitionRequest, 'id' | 'created_at' | 'profiles'> {}
