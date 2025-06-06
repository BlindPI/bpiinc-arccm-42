import { supabase } from '@/integrations/supabase/client';

export interface TeamScopedMetrics {
  organizationUsers: number;
  activeCertifications: number;
  expiringSoon: number;
  complianceIssues: number;
  dashboardType: 'global' | 'admin' | 'team_scoped';
}

export class TeamScopedAnalyticsService {
  
  /**
   * Get team-scoped metrics for dashboard
   * This is a secure replacement for the global useAdminDashboardData
   */
  static async getTeamScopedMetrics(userId: string): Promise<TeamScopedMetrics> {
    try {
      // Get user profile to determine role and access level
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error getting user profile:', profileError);
        return this.getEmptyMetrics('team_scoped');
      }

      const dashboardType = this.getDashboardType(profile.role);

      // For SA users, allow global access (existing behavior)
      if (dashboardType === 'global') {
        return await this.getGlobalMetrics();
      }

      // For team-scoped users, get only their team's data
      return await this.getRestrictedMetrics(userId, dashboardType);

    } catch (error) {
      console.error('Error getting team-scoped metrics:', error);
      return this.getEmptyMetrics('team_scoped');
    }
  }

  /**
   * Get global metrics (SA users only)
   */
  private static async getGlobalMetrics(): Promise<TeamScopedMetrics> {
    try {
      // Get organization users count
      const { count: organizationUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Get active certifications
      const { count: activeCertifications } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Get compliance issues (if table exists)
      let complianceIssues = 0;
      try {
        const { count } = await supabase
          .from('compliance_issues')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OPEN');
        complianceIssues = count || 0;
      } catch {
        // Table doesn't exist yet, ignore
      }

      // Calculate expiring certificates
      const expiringSoon = await this.calculateExpiringSoon();

      return {
        organizationUsers: organizationUsers || 0,
        activeCertifications: activeCertifications || 0,
        expiringSoon,
        complianceIssues,
        dashboardType: 'global'
      };

    } catch (error) {
      console.error('Error getting global metrics:', error);
      return this.getEmptyMetrics('global');
    }
  }

  /**
   * Get restricted metrics for team members
   */
  private static async getRestrictedMetrics(userId: string, dashboardType: 'admin' | 'team_scoped'): Promise<TeamScopedMetrics> {
    try {
      // Get user's team memberships
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          team_id,
          teams!inner(
            id,
            name,
            visibility,
            created_by
          )
        `)
        .eq('user_id', userId);

      if (!teamMemberships || teamMemberships.length === 0) {
        return this.getEmptyMetrics(dashboardType);
      }

      // For now, return limited metrics since we don't have location-based filtering yet
      // This will be enhanced after database migrations are applied
      
      // Get a subset of users (team members only)
      const teamIds = teamMemberships.map(tm => tm.team_id);
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .in('team_id', teamIds);

      const teamMemberIds = teamMembers?.map(tm => tm.user_id) || [];

      // Count active users in teams
      let organizationUsers = 0;
      if (teamMemberIds.length > 0) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE')
          .in('id', teamMemberIds);
        organizationUsers = count || 0;
      }

      // For certificates, we'll need to implement location-based filtering after migration
      // For now, return 0 to prevent data leakage
      const activeCertifications = 0;
      const expiringSoon = 0;
      const complianceIssues = 0;

      return {
        organizationUsers,
        activeCertifications,
        expiringSoon,
        complianceIssues,
        dashboardType
      };

    } catch (error) {
      console.error('Error getting restricted metrics:', error);
      return this.getEmptyMetrics(dashboardType);
    }
  }

  /**
   * Calculate expiring certificates
   */
  private static async calculateExpiringSoon(): Promise<number> {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: expiringCerts } = await supabase
        .from('certificates')
        .select('expiry_date')
        .eq('status', 'ACTIVE');

      if (!expiringCerts) return 0;

      return expiringCerts.filter(cert => {
        try {
          const expiryDate = new Date(cert.expiry_date);
          return expiryDate <= thirtyDaysFromNow && expiryDate > new Date();
        } catch {
          return false;
        }
      }).length;

    } catch (error) {
      console.error('Error calculating expiring certificates:', error);
      return 0;
    }
  }

  /**
   * Determine dashboard type based on role
   */
  private static getDashboardType(role: string): 'global' | 'admin' | 'team_scoped' {
    if (role === 'SA') return 'global';
    if (role === 'AD') return 'admin';
    return 'team_scoped';
  }

  /**
   * Get empty metrics structure
   */
  private static getEmptyMetrics(dashboardType: 'global' | 'admin' | 'team_scoped'): TeamScopedMetrics {
    return {
      organizationUsers: 0,
      activeCertifications: 0,
      expiringSoon: 0,
      complianceIssues: 0,
      dashboardType
    };
  }

  /**
   * Check if user can access global analytics
   */
  static async canAccessGlobalAnalytics(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return profile?.role === 'SA';
    } catch {
      return false;
    }
  }

  /**
   * Check if user can access multi-team analytics
   */
  static async canAccessMultiTeamAnalytics(userId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      return ['SA', 'AD'].includes(profile?.role);
    } catch {
      return false;
    }
  }

  /**
   * Get user's dashboard access level
   */
  static async getUserDashboardAccess(userId: string): Promise<{
    canAccessGlobal: boolean;
    canAccessMultiTeam: boolean;
    isTeamRestricted: boolean;
    dashboardType: 'global' | 'admin' | 'team_scoped';
  }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      const role = profile?.role || '';
      const dashboardType = this.getDashboardType(role);

      return {
        canAccessGlobal: role === 'SA',
        canAccessMultiTeam: ['SA', 'AD'].includes(role),
        isTeamRestricted: !['SA', 'AD'].includes(role),
        dashboardType
      };
    } catch {
      return {
        canAccessGlobal: false,
        canAccessMultiTeam: false,
        isTeamRestricted: true,
        dashboardType: 'team_scoped'
      };
    }
  }
}