
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = SupabaseUser;

export type AuthUserWithProfile = {
  id: string;
  email?: string;
  role: string;
  display_name?: string;
  // Need to add consistency - use this for AuthUserWithProfile instead of profile property
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
  authReady?: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Add missing methods that are implemented in useAuthProvider
  login?: (email: string, password: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  register?: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  resetPassword?: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updatePassword?: (password: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation?: (token: string, password: string, displayName?: string) => Promise<{ success: boolean; user?: User; error?: string; message?: string }>;
}
