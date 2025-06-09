
// Import unified types from single source of truth
import type { UserRole, Profile } from './supabase-schema';

// Use Profile as UserProfile to maintain compatibility
export type { UserRole, Profile as UserProfile } from './supabase-schema';

export interface AuthUserWithProfile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  profile?: Profile;
  created_at?: string;
  last_sign_in_at?: string;
}

export interface AuthContextType {
  user: AuthUserWithProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  acceptInvitation?: (token: string, password: string) => Promise<void>;
  loading: boolean;
  authReady: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  message?: string;
  requirements: string[];
  strength: number;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}
