
export interface Profile {
  id: string;
  display_name?: string;
  email: string;
  role: string;
  phone?: string;
  organization?: string;
  created_at?: string;
  updated_at?: string;
  compliance_status?: boolean | null;
  last_training_date?: string | null;
  next_training_due?: string | null;
  performance_score?: number | null;
  training_hours?: number | null;
  certifications_count?: number | null;
  location_id?: string | null;
  department?: string | null;
  supervisor_id?: string | null;
  user_id?: string;
}

export interface ExtendedProfile extends Profile {
  teams?: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  locations?: Array<{
    id: string;
    name: string;
  }>;
  metrics?: {
    performance_score: number;
    compliance_score: number;
    training_completion_rate: number;
  };
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description?: string;
          team_type: string;
          status: 'active' | 'inactive' | 'suspended';
          location_id?: string;
          provider_id?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          performance_score?: number;
        };
        Insert: {
          name: string;
          description?: string;
          team_type: string;
          status?: 'active' | 'inactive' | 'suspended';
          location_id?: string;
          provider_id?: string;
          created_by: string;
        };
        Update: Partial<{
          name: string;
          description?: string;
          team_type: string;
          status: 'active' | 'inactive' | 'suspended';
          location_id?: string;
          provider_id?: string;
          performance_score?: number;
        }>;
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: 'ADMIN' | 'MEMBER';
          status: 'active' | 'inactive';
          permissions?: string[];
          created_at: string;
          updated_at: string;
          last_activity?: string;
          location_assignment?: string;
          assignment_start_date?: string;
          assignment_end_date?: string;
          team_position?: string;
        };
        Insert: {
          team_id: string;
          user_id: string;
          role: 'ADMIN' | 'MEMBER';
          status?: 'active' | 'inactive';
          permissions?: string[];
        };
        Update: Partial<{
          role: 'ADMIN' | 'MEMBER';
          status: 'active' | 'inactive';
          permissions?: string[];
          location_assignment?: string;
          assignment_start_date?: string;
          assignment_end_date?: string;
          team_position?: string;
        }>;
      };
    };
  };
}
