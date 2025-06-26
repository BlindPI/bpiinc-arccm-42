
export type UserRole = 'IT' | 'IP' | 'IC' | 'AP' | 'AD' | 'SA' | 'IN';

export interface Profile {
  id: string;
  role: UserRole;
  display_name?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  phone?: string;
  organization?: string;
  job_title?: string;
  compliance_tier?: 'basic' | 'robust';
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
