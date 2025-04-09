import { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type User = SupabaseUser;

export type AuthUserWithProfile = {
  id: string;
  email?: string;
  role: string;
  display_name?: string;
  // These fields are needed for the Profile page
  created_at?: string;
  last_sign_in_at?: string;
  // Add any other profile fields needed
};

export type UserProfile = {
  id: string;
  display_name?: string;
  role: string;
  email?: string;
  phone?: string;
  address?: string;
  bio?: string;
  teaching_hours?: number;
  supervision_hours?: number;
  certification_date?: string;
  avatar_url?: string;
  status?: string;
  preferences?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
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
  user: AuthUserWithProfile | null;
  session: Session | null;
  loading: boolean;
  authReady?: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Add methods that are implemented in useAuthProvider
  login?: (email: string, password: string) => Promise<{ success: boolean; user?: SupabaseUser; error?: string }>;
  register?: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; user?: SupabaseUser; error?: string }>;
  resetPassword?: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updatePassword?: (password: string) => Promise<{ success: boolean; error?: string }>;
  acceptInvitation?: (token: string, password: string, displayName?: string) => Promise<{ success: boolean; user?: SupabaseUser; error?: string }>;
}
