
import { User } from '@supabase/supabase-js';

// Update to match supabase-schema types
export type UserRole = 'SA' | 'AD' | 'IC' | 'IP' | 'IT' | 'AP' | 'IN';

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization?: string;
  job_title?: string;
  phone?: string;
  compliance_status?: boolean;
  compliance_notes?: string;
  last_compliance_check?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthUserWithProfile {
  id: string;
  email: string;
  display_name: string;
  role: string;
  organization?: string;
  job_title?: string;
  phone?: string;
  created_at: string;
  last_sign_in_at: string;
}

export interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: any;
  loading: boolean;
  authReady: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profileData?: Partial<UserProfile>) => Promise<void>;
  signOut: () => Promise<void>;
  acceptInvitation: (token: string, userData: any) => Promise<{ success: boolean; error?: any }>;
  updateProfile: (profileData: Partial<UserProfile>) => Promise<{ success: boolean; error?: any }>;
  refreshUser: () => Promise<void>;
  isAdmin: () => boolean;
  hasRole: (roles: string[]) => boolean;
}
