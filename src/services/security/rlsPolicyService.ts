
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
  static async getAllPolicies(): Promise<RLSPolicy[]> {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public');

    if (error) throw error;
    return data || [];
  }

  static async getTablePolicies(tableName: string): Promise<RLSPolicy[]> {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);

    if (error) throw error;
    return data || [];
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
