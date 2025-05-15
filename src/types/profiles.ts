
import { UserRole } from "@/lib/roles";

export interface Profile {
  id: string;
  display_name?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
  status?: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  preferences?: any;
  bio?: string;
  address?: string;
  compliance_status?: boolean;
}
