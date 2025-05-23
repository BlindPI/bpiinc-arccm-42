
import { User } from '@supabase/supabase-js';

// Update to match supabase-schema types
export type UserRole = 'SA' | 'AD' | 'IC' | 'IP' | 'IT' | 'AP' | 'IN';

export interface UserProfile {
  id: string;
  role: UserRole;
  display_name?: string;
  email?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  created_at: string;
  updated_at: string;
}

// Auth user with profile information
export interface AuthUserWithProfile {
  id: string;
  email?: string;
  role: UserRole;
  display_name: string;
  created_at: string;
  last_sign_in_at?: string;
  updateProfile?: (data: Partial<UserProfile>) => Promise<void>;
}

// Auth context type
export interface AuthContextType {
  user: AuthUserWithProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

// Password validation result
export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
  message?: string;
  requirements?: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}
