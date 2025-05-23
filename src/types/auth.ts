
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
