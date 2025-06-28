
import { supabase } from '@/integrations/supabase/client';
import type { DashboardMetrics } from '@/types';

export class DataService {
  static async getDashboardMetrics(role: string): Promise<DashboardMetrics> {
    try {
      // Get user counts
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, status');

      if (usersError) throw usersError;

      // Get certificate requests
      const { data: requests, error: requestsError } = await supabase
        .from('certificate_requests')
        .select('id, status');

      if (requestsError) throw requestsError;

      // Get certificates
      const { data: certificates, error: certsError } = await supabase
        .from('certificates')
        .select('id, status');

      if (certsError) throw certsError;

      const totalUsers = users?.length || 0;
      const activeUsers = users?.filter(u => u.status === 'ACTIVE').length || 0;
      const pendingApprovals = requests?.filter(r => r.status === 'PENDING').length || 0;
      const activeCertifications = certificates?.filter(c => c.status === 'ACTIVE').length || 0;

      return {
        totalUsers,
        activeUsers,
        pendingApprovals,
        activeCertifications,
        systemHealth: {
          critical: 0,
          warnings: 1,
          healthy: 2
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        pendingApprovals: 0,
        activeCertifications: 0,
        systemHealth: {
          critical: 0,
          warnings: 0,
          healthy: 0
        }
      };
    }
  }

  static async getCertificates() {
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching certificates:', error);
      return [];
    }
  }

  static async getTeams() {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teams:', error);
      return [];
    }
  }

  static async getUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }
}
