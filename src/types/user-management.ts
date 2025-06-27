export interface User {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string;
  phone: string;
  confirmed_at: string;
  last_sign_in_at: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: any;
  identities: any[];
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  role?: string;
  phone?: string;
  location?: string;
  department?: string;
  job_title?: string;
  manager_id?: string;
  team_id?: string;
  status?: string;
  compliance_tier?: string;
  compliance_status?: boolean;
  compliance_score?: number;
  pending_actions?: number;
  team_count?: number;
  certifications_count?: number;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  last_login?: string;
  is_active?: boolean;
}
