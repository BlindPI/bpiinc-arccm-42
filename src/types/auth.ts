import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = SupabaseUser;

export type AuthUserWithProfile = {
  id: string;
  email?: string;
  role: string;
  display_name?: string;
};

export type UserProfile = {
  id: string;
  display_name: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

export type PasswordValidationResult = {
  isValid: boolean;
  message?: string;
  requirements: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
};

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
