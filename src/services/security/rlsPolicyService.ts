
import { supabase } from '@/integrations/supabase/client';

export interface RLSPolicy {
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: string[];
  cmd: string;
  qual: string;
  with_check: string;
}

export class RLSPolicyService {
  // Since we can't access pg_policies directly through Supabase client,
  // we'll use a mock implementation that provides the status of our known tables
  static async getAllPolicies(): Promise<RLSPolicy[]> {
    // Return mock data representing our known RLS policies
    const mockPolicies: RLSPolicy[] = [
      {
        schemaname: 'public',
        tablename: 'profiles',
        policyname: 'Users can view own profile',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        cmd: 'SELECT',
        qual: 'auth.uid() = id',
        with_check: ''
      },
      {
        schemaname: 'public',
        tablename: 'certificates',
        policyname: 'Users can view certificates',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        cmd: 'SELECT',
        qual: 'true',
        with_check: ''
      },
      {
        schemaname: 'public',
        tablename: 'teams',
        policyname: 'Users can view teams',
        permissive: 'PERMISSIVE',
        roles: ['authenticated'],
        cmd: 'SELECT',
        qual: 'true',
        with_check: ''
      }
    ];
    
    return mockPolicies;
  }

  static async getTablePolicies(tableName: string): Promise<RLSPolicy[]> {
    const allPolicies = await this.getAllPolicies();
    return allPolicies.filter(policy => policy.tablename === tableName);
  }

  static async checkUserPermissions(userId: string, resource: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profile) return false;

      // Role-based access control
      const adminRoles = ['SA', 'AD'];
      const instructorRoles = ['SA', 'AD', 'IP', 'IT', 'IC'];

      switch (resource) {
        case 'analytics':
          return adminRoles.includes(profile.role);
        case 'user_management':
          return adminRoles.includes(profile.role);
        case 'course_management':
          return instructorRoles.includes(profile.role);
        case 'scheduling':
          return instructorRoles.includes(profile.role);
        default:
          return true; // Basic access
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      return false;
    }
  }

  static async getUserRole(userId: string): Promise<string | null> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }
}
