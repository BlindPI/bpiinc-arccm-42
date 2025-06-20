
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedAPMetrics {
  // Core metrics
  locationName: string | null;
  locationCity: string | null;
  locationState: string | null;
  locationAddress: string | null;
  
  // User info
  apUserName: string;
  apUserEmail: string;
  apUserPhone: string | null;
  
  // Assignment status
  hasLocationAssignment: boolean;
  hasTeamMembership: boolean;
  isDualRole: boolean;
  assignmentStatus: 'complete' | 'partial' | 'missing' | 'conflict';
  
  // Metrics with fallbacks
  totalTeams: number;
  totalMembers: number;
  totalCertificates: number;
  recentCertificates: number;
  
  // Health indicators
  healthScore: number;
  issues: string[];
  recommendations: string[];
  
  // Detailed breakdowns
  teamBreakdown: Array<{
    teamId: string;
    teamName: string;
    memberCount: number;
    status: string;
  }>;
  
  certificateBreakdown: Array<{
    month: string;
    count: number;
  }>;
}

export class EnhancedAPDashboardService {
  static async getEnhancedAPMetrics(userId: string): Promise<EnhancedAPMetrics> {
    try {
      // Get AP user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, email, phone, role')
        .eq('id', userId)
        .single();

      if (!profile || profile.role !== 'AP') {
        throw new Error('User is not an AP user');
      }

      // Get location assignments
      const { data: locationAssignments } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          id, location_id, status, assignment_role,
          locations(id, name, city, state, address)
        `)
        .eq('ap_user_id', userId)
        .eq('status', 'active');

      // Get team memberships (for dual-role detection)
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          id, team_id, role, status,
          teams(id, name, status)
        `)
        .eq('user_id', userId)
        .eq('status', 'active');

      const hasLocationAssignment = (locationAssignments?.length || 0) > 0;
      const hasTeamMembership = (teamMemberships?.length || 0) > 0;
      const isDualRole = hasLocationAssignment && hasTeamMembership;

      // Determine assignment status
      let assignmentStatus: 'complete' | 'partial' | 'missing' | 'conflict';
      if (isDualRole) {
        assignmentStatus = 'conflict';
      } else if (hasLocationAssignment) {
        assignmentStatus = 'complete';
      } else if (hasTeamMembership) {
        assignmentStatus = 'partial';
      } else {
        assignmentStatus = 'missing';
      }

      // Get primary location info
      const primaryLocation = locationAssignments?.[0]?.locations;
      
      // Get metrics based on assignment type
      let metrics;
      if (hasLocationAssignment && primaryLocation) {
        metrics = await this.getLocationBasedMetrics(primaryLocation.id, userId);
      } else if (hasTeamMembership) {
        metrics = await this.getTeamBasedMetrics(teamMemberships!, userId);
      } else {
        metrics = await this.getFallbackMetrics(userId);
      }

      // Calculate health score
      const healthScore = this.calculateHealthScore({
        hasLocationAssignment,
        hasTeamMembership,
        isDualRole,
        ...metrics
      });

      // Generate issues and recommendations
      const { issues, recommendations } = this.generateHealthRecommendations({
        hasLocationAssignment,
        hasTeamMembership,
        isDualRole,
        assignmentStatus,
        ...metrics
      });

      return {
        // Location info
        locationName: primaryLocation?.name || null,
        locationCity: primaryLocation?.city || null,
        locationState: primaryLocation?.state || null,
        locationAddress: primaryLocation?.address || null,
        
        // User info
        apUserName: profile.display_name,
        apUserEmail: profile.email || '',
        apUserPhone: profile.phone,
        
        // Assignment status
        hasLocationAssignment,
        hasTeamMembership,
        isDualRole,
        assignmentStatus,
        
        // Metrics
        ...metrics,
        
        // Health
        healthScore,
        issues,
        recommendations
      };
    } catch (error) {
      console.error('Error getting enhanced AP metrics:', error);
      throw error;
    }
  }

  private static async getLocationBasedMetrics(locationId: string, userId: string) {
    try {
      // Get teams in this location
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id, name, status,
          team_members(id, status)
        `)
        .eq('location_id', locationId);

      // Get certificates for this location
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id, created_at, status')
        .eq('location_id', locationId);

      const totalTeams = teams?.length || 0;
      const totalMembers = teams?.reduce((sum, team) => 
        sum + (team.team_members?.filter(m => m.status === 'active').length || 0), 0) || 0;
      const totalCertificates = certificates?.filter(c => c.status === 'ACTIVE').length || 0;
      
      // Recent certificates (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCertificates = certificates?.filter(c => 
        new Date(c.created_at) > thirtyDaysAgo && c.status === 'ACTIVE'
      ).length || 0;

      // Team breakdown
      const teamBreakdown = teams?.map(team => ({
        teamId: team.id,
        teamName: team.name,
        memberCount: team.team_members?.filter(m => m.status === 'active').length || 0,
        status: team.status
      })) || [];

      // Certificate breakdown by month (last 6 months)
      const certificateBreakdown = this.generateCertificateBreakdown(certificates || []);

      return {
        totalTeams,
        totalMembers,
        totalCertificates,
        recentCertificates,
        teamBreakdown,
        certificateBreakdown
      };
    } catch (error) {
      console.error('Error getting location-based metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  private static async getTeamBasedMetrics(teamMemberships: any[], userId: string) {
    try {
      const teamIds = teamMemberships.map(tm => tm.team_id);
      
      // Get team details with member counts
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id, name, status, location_id,
          team_members(id, status)
        `)
        .in('id', teamIds);

      // Get certificates for teams' locations
      const locationIds = teams?.map(t => t.location_id).filter(Boolean) || [];
      let certificates: any[] = [];
      
      if (locationIds.length > 0) {
        const { data: certs } = await supabase
          .from('certificates')
          .select('id, created_at, status, location_id')
          .in('location_id', locationIds);
        certificates = certs || [];
      }

      const totalTeams = teams?.length || 0;
      const totalMembers = teams?.reduce((sum, team) => 
        sum + (team.team_members?.filter(m => m.status === 'active').length || 0), 0) || 0;
      const totalCertificates = certificates.filter(c => c.status === 'ACTIVE').length;
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentCertificates = certificates.filter(c => 
        new Date(c.created_at) > thirtyDaysAgo && c.status === 'ACTIVE'
      ).length;

      const teamBreakdown = teams?.map(team => ({
        teamId: team.id,
        teamName: team.name,
        memberCount: team.team_members?.filter(m => m.status === 'active').length || 0,
        status: team.status
      })) || [];

      const certificateBreakdown = this.generateCertificateBreakdown(certificates);

      return {
        totalTeams,
        totalMembers,
        totalCertificates,
        recentCertificates,
        teamBreakdown,
        certificateBreakdown
      };
    } catch (error) {
      console.error('Error getting team-based metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  private static async getFallbackMetrics(userId: string) {
    console.warn(`AP user ${userId} has no assignments - using fallback metrics`);
    return this.getEmptyMetrics();
  }

  private static getEmptyMetrics() {
    return {
      totalTeams: 0,
      totalMembers: 0,
      totalCertificates: 0,
      recentCertificates: 0,
      teamBreakdown: [],
      certificateBreakdown: []
    };
  }

  private static generateCertificateBreakdown(certificates: any[]) {
    const breakdown: Array<{ month: string; count: number }> = [];
    const months = [];
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      });
    }

    months.forEach(month => {
      const count = certificates.filter(cert => {
        const certDate = new Date(cert.created_at);
        const certKey = `${certDate.getFullYear()}-${String(certDate.getMonth() + 1).padStart(2, '0')}`;
        return certKey === month.key && cert.status === 'ACTIVE';
      }).length;

      breakdown.push({
        month: month.label,
        count
      });
    });

    return breakdown;
  }

  private static calculateHealthScore(data: any): number {
    let score = 100;

    // Deduct for assignment issues
    if (!data.hasLocationAssignment && !data.hasTeamMembership) {
      score -= 50; // Major deduction for no assignments
    }
    
    if (data.isDualRole) {
      score -= 30; // Deduction for role conflicts
    }

    if (!data.hasLocationAssignment && data.hasTeamMembership) {
      score -= 20; // Partial deduction for incomplete AP setup
    }

    // Deduct for low activity
    if (data.totalTeams === 0) {
      score -= 20;
    }

    if (data.totalMembers === 0) {
      score -= 15;
    }

    if (data.recentCertificates === 0) {
      score -= 10;
    }

    return Math.max(0, Math.min(100, score));
  }

  private static generateHealthRecommendations(data: any): { issues: string[]; recommendations: string[] } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!data.hasLocationAssignment && !data.hasTeamMembership) {
      issues.push('No location assignment or team membership');
      recommendations.push('Contact administrator to assign you to a location');
    }

    if (data.isDualRole) {
      issues.push('Dual role detected - both AP and team member');
      recommendations.push('Review role assignments with administrator');
    }

    if (!data.hasLocationAssignment && data.hasTeamMembership) {
      issues.push('Team member without location assignment');
      recommendations.push('Request location assignment for full AP functionality');
    }

    if (data.totalTeams === 0) {
      issues.push('No teams under management');
      recommendations.push('Create teams or assign existing teams to your location');
    }

    if (data.totalMembers === 0 && data.totalTeams > 0) {
      issues.push('Teams exist but have no members');
      recommendations.push('Add members to teams to begin training activities');
    }

    if (data.recentCertificates === 0) {
      issues.push('No recent certificate activity');
      recommendations.push('Encourage teams to complete training and certifications');
    }

    return { issues, recommendations };
  }
}
