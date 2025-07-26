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
   * Get total certificates count - FIXED: Uses location-based filtering for AP users
   */
  static async getTotalCertificates(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      console.log('🔧 METRICS: getTotalCertificates for userId:', userId, 'isAdmin:', isAdmin);

      // **ADMIN USERS**: See all certificates
      if (isAdmin) {
        const { count, error } = await supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .eq('status', 'ACTIVE');

        if (error) {
          console.error('🔧 METRICS: Error fetching admin certificates:', error);
          return 0;
        }

        console.log('🔧 METRICS: Admin total certificates:', count);
        return count || 0;
      }

      if (!userId) {
        console.log('🔧 METRICS: No userId provided for non-admin user');
        return 0;
      }

      // **AP USERS**: Use location-based filtering (same as EnhancedCertificatesView)
      // First check if this is an AP user
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('🔧 METRICS: Error fetching user profile:', profileError);
        return 0;
      }

      if (profile.role === 'AP') {
        console.log('🔧 METRICS: AP user detected - using location-based filtering');
        
        // Get provider ID for this AP user
        const { data: apUser, error: apError } = await supabase
          .from('authorized_providers')
          .select('id, primary_location_id')
          .eq('user_id', userId)
          .single();
          
        if (apError || !apUser?.primary_location_id) {
          console.error('🔧 METRICS: Could not find provider/location for AP user:', apError);
          return 0;
        }
        
        const locationId = apUser.primary_location_id;
        console.log('🔧 METRICS: Using location-based filtering for location:', locationId);
        
        // Get certificates for this location
        const { count, error } = await supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .eq('location_id', locationId)
          .eq('status', 'ACTIVE');

        if (error) {
          console.error('🔧 METRICS: Error fetching location-based certificates:', error);
          return 0;
        }

        console.log('🔧 METRICS: AP user location-based certificate count:', count);
        return count || 0;
      }

      // **OTHER USERS**: Use issued_by filtering (original logic)
      console.log('🔧 METRICS: Non-AP user - using issued_by filtering');
      const { count, error } = await supabase
        .from('certificates')
        .select('id', { count: 'exact' })
        .eq('status', 'ACTIVE')
        .eq('issued_by', userId);

      if (error) {
        console.error('🔧 METRICS: Error fetching user certificates:', error);
        return 0;
      }

      console.log('🔧 METRICS: Non-AP user certificate count:', count);
      return count || 0;
    } catch (error) {
      console.error('🔧 METRICS: Error in getTotalCertificates:', error);
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
   * Get recent activity count (last 7 days) - FIXED: Uses location-based filtering for AP users
   */
  static async getRecentActivity(userId?: string, isAdmin: boolean = false): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      console.log('🔧 METRICS: getRecentActivity for userId:', userId, 'isAdmin:', isAdmin);

      // **ADMIN USERS**: See all recent activity
      if (isAdmin) {
        const { count, error } = await supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .gte('created_at', sevenDaysAgo.toISOString());

        if (error) {
          console.error('🔧 METRICS: Error fetching admin recent activity:', error);
          return 0;
        }

        console.log('🔧 METRICS: Admin recent activity:', count);
        return count || 0;
      }

      if (!userId) {
        console.log('🔧 METRICS: No userId provided for non-admin user');
        return 0;
      }

      // **AP USERS**: Use location-based filtering (consistent with getTotalCertificates)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('🔧 METRICS: Error fetching user profile for recent activity:', profileError);
        return 0;
      }

      if (profile.role === 'AP') {
        console.log('🔧 METRICS: AP user - using location-based recent activity filtering');
        
        // Get provider location for this AP user
        const { data: apUser, error: apError } = await supabase
          .from('authorized_providers')
          .select('primary_location_id')
          .eq('user_id', userId)
          .single();
          
        if (apError || !apUser?.primary_location_id) {
          console.error('🔧 METRICS: Could not find location for AP user recent activity:', apError);
          return 0;
        }
        
        const locationId = apUser.primary_location_id;
        console.log('🔧 METRICS: Using location-based recent activity for location:', locationId);
        
        // Get recent certificates for this location
        const { count, error } = await supabase
          .from('certificates')
          .select('id', { count: 'exact' })
          .eq('location_id', locationId)
          .gte('created_at', sevenDaysAgo.toISOString());

        if (error) {
          console.error('🔧 METRICS: Error fetching location-based recent activity:', error);
          return 0;
        }

        console.log('🔧 METRICS: AP user location-based recent activity:', count);
        return count || 0;
      }

      // **OTHER USERS**: Use issued_by filtering (original logic)
      console.log('🔧 METRICS: Non-AP user - using issued_by recent activity filtering');
      const { count, error } = await supabase
        .from('certificates')
        .select('id', { count: 'exact' })
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('issued_by', userId);

      if (error) {
        console.error('🔧 METRICS: Error fetching user recent activity:', error);
        return 0;
      }

      console.log('🔧 METRICS: Non-AP user recent activity:', count);
      return count || 0;
    } catch (error) {
      console.error('🔧 METRICS: Error in getRecentActivity:', error);
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