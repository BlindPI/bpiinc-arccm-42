export type UserRole = 'IT' | 'IP' | 'IC' | 'AP' | 'AD' | 'SA' | 'IN';

export interface AuthUserWithProfile {
  id: string;
  email?: string;
  role?: UserRole;
  display_name?: string;
  [key: string]: any;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  email?: string;
  display_name?: string;
  role: UserRole;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  compliance_tier?: 'basic' | 'robust'; // Added compliance_tier
  organization?: string;
  job_title?: string;
  phone?: string;
  compliance_status?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Add alias for Profile type to maintain compatibility
export type Profile = UserProfile;

export interface PasswordValidationResult {
  valid: boolean;
  message: string;
  strength: number;
  requirements?: {
    hasMinLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export interface AuthContextType {
  user: AuthUserWithProfile | null;
  session: any;
  loading: boolean;
  authReady?: boolean;
  
  // Required methods
  signUp: (email: string, password: string, profileData?: Partial<UserProfile>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  
  // Optional methods
  login?: (email: string, password: string) => Promise<{success: boolean, error?: string}>;
  register?: (email: string, password: string, profileData?: Partial<UserProfile>) => Promise<{success: boolean, error?: string}>;
  resetPassword?: (email: string) => Promise<{success: boolean, error?: string}>;
  updatePassword?: (password: string) => Promise<{success: boolean, error?: string}>;
  updateProfile?: (updates: Partial<UserProfile>) => Promise<{success: boolean, error?: string}>;
  acceptInvitation?: (token: string, password: string, displayName?: string) => Promise<{success: boolean, user?: any, error?: string}>;
}
