import { supabase } from '@/integrations/supabase/client';

export interface CertificateMetrics {
  totalCertificates: number;
  pendingRequests: number;
  completionRate: number;
  recentActivity: number;
  archivedRequests: number;
  recentUploads: number;
  activeRosters: number;
}

export interface NavigationStats {
  totalCertificates: number;
  pendingRequests: number;
  recentActivity: number;
  archivedRequests: number;
}

export class CertificateMetricsService {
  /**
   * Get comprehensive dashboard metrics for the certificate management system
   */
  static async getDashboardMetrics(userId?: string, isAdmin: boolean = false): Promise<CertificateMetrics> {
    try {
      console.log('Fetching dashboard metrics for user:', userId, 'isAdmin:', isAdmin);

      // Get total certificates count
      const totalCertificates = await this.getTotalCertificates(userId, isAdmin);
      
      // Get pending requests count
      const pendingRequests = await this.getPendingRequests(userId, isAdmin);
      
      // Get completion rate
      const completionRate = await this.getCompletionRate(userId, isAdmin);
      
      // Get recent activity (last 7 days)
      const recentActivity = await this.getRecentActivity(userId, isAdmin);
      
      // Get archived requests count
      const archivedRequests = await this.getArchivedRequests(userId, isAdmin);
      
      // Get recent uploads (last 30 days)
      const recentUploads = await this.getRecentUploads(userId, isAdmin);
      
      // Get active rosters count
      const activeRosters = await this.getActiveRosters(userId, isAdmin);

      const metrics = {
        totalCertificates,
        pendingRequests,
        completionRate,
        recentActivity,
        archivedRequests,
        recentUploads,
        activeRosters
      };

      console.log('Dashboard metrics fetched:', metrics);
      return metrics;

    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      // Return zeros instead of throwing to prevent UI crashes
      return {
        totalCertificates: 0,
        pendingRequests: 0,
        completionRate: 0,
        recentActivity: 0,
        archivedRequests: 0,
        recentUploads: 0,
        activeRosters: 0
      };
    }
  }

  /**
   * Get navigation card statistics
   */
  static async getNavigationStats(userId?: string, isAdmin: boolean = false): Promise<NavigationStats> {
    try {
      const [totalCertificates, pendingRequests, recentActivity, archivedRequests] = await Promise.all([
        this.getTotalCertificates(userId, isAdmin),
        this.getPendingRequests(userId, isAdmin),
        this.getRecentActivity(userId, isAdmin),
        this.getArchivedRequests(userId, isAdmin)
      ]);

      return {
        totalCertificates,
        pendingRequests,
        recentActivity,
        archivedRequests
      };
    } catch (error) {
      console.error('Error fetching navigation stats:', error);
      return {
        totalCertificates: 0,
        pendingRequests: 0,
        recentActivity: 0,
        archivedRequests: 0
      };
    }
  }

  /**
   * Get total certificates count
   */
  static async getTotalCertificates(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      let query = supabase
        .from('certificates')
        .select('id', { count: 'exact' })
        .eq('status', 'ACTIVE');

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('issued_by', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching total certificates:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getTotalCertificates:', error);
      return 0;
    }
  }

  /**
   * Get pending certificate requests count
   */
  static async getPendingRequests(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      let query = supabase
        .from('certificate_requests')
        .select('id', { count: 'exact' })
        .eq('status', 'PENDING');

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching pending requests:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getPendingRequests:', error);
      return 0;
    }
  }

  /**
   * Calculate completion rate (approved vs total requests)
   */
  static async getCompletionRate(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      // Get total requests
      let totalResult;
      if (!isAdmin && userId) {
        totalResult = await supabase
          .from('certificate_requests')
          .select('id', { count: 'exact' })
          .eq('user_id', userId);
      } else {
        totalResult = await supabase
          .from('certificate_requests')
          .select('id', { count: 'exact' });
      }

      if (totalResult.error) {
        console.error('Error fetching total requests for completion rate:', totalResult.error);
        return 0;
      }

      const totalRequests = totalResult.count || 0;
      if (totalRequests === 0) {
        return 0;
      }

      // Get approved requests
      let approvedResult;
      if (!isAdmin && userId) {
        approvedResult = await supabase
          .from('certificate_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'APPROVED')
          .eq('user_id', userId);
      } else {
        approvedResult = await supabase
          .from('certificate_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'APPROVED');
      }

      if (approvedResult.error) {
        console.error('Error fetching approved requests for completion rate:', approvedResult.error);
        return 0;
      }

      const approvedRequests = approvedResult.count || 0;
      const rate = Math.round((approvedRequests / totalRequests) * 100);
      return rate;

    } catch (error) {
      console.error('Error in getCompletionRate:', error);
      return 0;
    }
  }

  /**
   * Get recent activity count (last 7 days)
   */
  static async getRecentActivity(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let query = supabase
        .from('certificates')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('issued_by', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching recent activity:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return 0;
    }
  }

  /**
   * Get archived requests count
   */
  static async getArchivedRequests(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      let query = supabase
        .from('certificate_requests')
        .select('id', { count: 'exact' })
        .in('status', ['REJECTED', 'CANCELLED']);

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching archived requests:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getArchivedRequests:', error);
      return 0;
    }
  }

  /**
   * Get recent uploads count (last 30 days)
   */
  static async getRecentUploads(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let query = supabase
        .from('email_batch_operations')
        .select('id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('status', 'COMPLETED');

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('user_id', userId);
      }

      const { count, error } = await query;

      if (error) {
        console.error('Error fetching recent uploads:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getRecentUploads:', error);
      return 0;
    }
  }

  /**
   * Get active rosters count
   */
  static async getActiveRosters(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      let query = supabase
        .from('certificates')
        .select('roster_id', { count: 'exact' })
        .not('roster_id', 'is', null)
        .eq('status', 'ACTIVE');

      // Filter by user if not admin
      if (!isAdmin && userId) {
        query = query.eq('issued_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching active rosters:', error);
        return 0;
      }

      // Count unique roster IDs
      const uniqueRosters = new Set(data?.map(cert => cert.roster_id));
      return uniqueRosters.size;

    } catch (error) {
      console.error('Error in getActiveRosters:', error);
      return 0;
    }
  }

  /**
   * Get certificate statistics by date range
   */
  static async getCertificateStatsByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
    isAdmin: boolean = false
  ): Promise<{ date: string; count: number }[]> {
    try {
      let query = supabase
        .from('certificates')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'ACTIVE');

      if (!isAdmin && userId) {
        query = query.eq('issued_by', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching certificate stats by date range:', error);
        return [];
      }

      // Group by date
      const dateGroups: { [key: string]: number } = {};
      data?.forEach(cert => {
        const date = new Date(cert.created_at).toISOString().split('T')[0];
        dateGroups[date] = (dateGroups[date] || 0) + 1;
      });

      return Object.entries(dateGroups).map(([date, count]) => ({ date, count }));

    } catch (error) {
      console.error('Error in getCertificateStatsByDateRange:', error);
      return [];
    }
  }
}