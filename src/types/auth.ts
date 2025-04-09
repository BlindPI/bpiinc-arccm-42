
export type UserRole = 'IT' | 'IP' | 'IC' | 'AP' | 'AD' | 'SA';

export interface AuthUserWithProfile {
  id: string;
  email?: string;
  role?: UserRole;
  display_name?: string;
  [key: string]: any;
}
