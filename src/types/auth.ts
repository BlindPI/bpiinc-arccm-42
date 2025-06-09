
export type UserRole = 
  | 'SA'    // System Administrator
  | 'AD'    // Administrator  
  | 'AP'    // Authorized Provider
  | 'TL'    // Team Leader
  | 'IC'    // Instructor Certified
  | 'IP'    // Instructor Provisional
  | 'IT'    // Instructor Training
  | 'IN'    // Instructor New
  | 'ST';   // Student

export interface UserProfile {
  id: string;
  user_id?: string;
  display_name: string;
  email: string;
  role: UserRole;
  organization?: string;
  phone?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  compliance_status?: boolean | null;
  last_training_date?: string | null;
  next_training_due?: string | null;
  performance_score?: number | null;
  training_hours?: number | null;
  certifications_count?: number | null;
  location_id?: string | null;
  department?: string | null;
  supervisor_id?: string | null;
}

export interface AuthUserWithProfile {
  id: string;
  email: string;
  profile: UserProfile;
  created_at?: string;
  last_sign_in_at?: string;
}

export interface AuthContextType {
  user: AuthUserWithProfile | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signOut?: () => Promise<void>;
  acceptInvitation?: (token: string, userData: any) => Promise<void>;
  loading: boolean;
  authReady?: boolean;
}

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  message?: string;
  requirements?: string[];
  strength: number;
}
