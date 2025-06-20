
import { supabase } from '@/integrations/supabase/client';

export interface EnhancedTeamMetrics {
  // Basic team info
  teamId: string;
  teamName: string;
  teamStatus: string;
  teamType: string;
  
  // Relationship validation
  hasValidLocation: boolean;
  hasValidProvider: boolean;
  relationshipHealth: 'healthy' | 'warning' | 'critical';
  
  // Location info
  locationId: string | null;
  locationName: string | null;
  locationCity: string | null;
  locationState: string | null;
  
  // Provider info
  providerId: string | null;
  providerName: string | null;
  providerType: string | null;
  
  // Membership metrics with validation
  totalMembers: number;
  activeMembers: number;
  adminMembers: number;
  membersByRole: Record<string, number>;
  
  // Performance metrics with fallbacks
  certificatesIssued: number;
  coursesCompleted: number;
  averagePerformance: number;
  complianceScore: number;
  
  // Health indicators
  issues: string[];
  recommendations: string[];
  warnings: string[];
  
  // Member details for validation
  memberDetails: Array<{
    userId: string;
    displayName: string;
    role: string;
    status: string;
    joinDate: string;
  }>;
  
  // Recent activity
  recentActivity: Array<{
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>;
}

export class EnhancedTeamDashboardService {
  static async getEnhancedTeamMetrics(teamId: string, currentUserId: string): Promise<EnhancedTeamMetrics> {
    try {
      // Get team with all relationships
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          id, name, status, team_type, provider_id, location_id,
          metadata, monthly_targets, current_metrics,
          locations(id, name, city, state, address),
          authorized_providers(id, name, provider_type, status)
        `)
        .eq('id', teamId)
        .single();

      if (teamError || !team) {
        throw new Error(`Team not found: ${teamError?.message || 'Unknown error'}`);
      }

      // Validate user has access to this team
      const hasAccess = await this.validateTeamAccess(teamId, currentUserId);
      if (!hasAccess) {
        throw new Error('Access denied to team data');
      }

      // Get team members with profiles
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select(`
          id, user_id, role, status, assignment_start_date,
          profiles(id, display_name, email, role)
        `)
        .eq('team_id', teamId);

      // Validate relationships
      const hasValidLocation = !!(team.location_id && team.locations);
      const hasValidProvider = !!(team.provider_id && team.authorized_providers);
      
      let relationshipHealth: 'healthy' | 'warning' | 'critical';
      if (hasValidLocation && hasValidProvider) {
        relationshipHealth = 'healthy';
      } else if (hasValidLocation || hasValidProvider) {
        relationshipHealth = 'warning';
      } else {
        relationshipHealth = 'critical';
      }

      // Calculate member metrics
      const activeMembers = teamMembers?.filter(m => m.status === 'active') || [];
      const totalMembers = teamMembers?.length || 0;
      const activeMemberCount = activeMembers.length;
      const adminMembers = activeMembers.filter(m => m.role === 'ADMIN').length;

      // Member breakdown by role
      const membersByRole: Record<string, number> = {};
      activeMembers.forEach(member => {
        membersByRole[member.role] = (membersByRole[member.role] || 0) + 1;
      });

      // Get performance metrics with fallbacks
      const performanceMetrics = await this.getTeamPerformanceMetrics(teamId, team.location_id);

      // Generate issues and recommendations
      const { issues, recommendations, warnings } = this.generateHealthAssessment({
        team,
        hasValidLocation,
        hasValidProvider,
        totalMembers: activeMemberCount,
        ...performanceMetrics
      });

      // Get member details
      const memberDetails = activeMembers.map(member => ({
        userId: member.user_id,
        displayName: member.profiles?.display_name || 'Unknown User',
        role: member.role,
        status: member.status,
        joinDate: member.assignment_start_date || 'Unknown'
      }));

      // Get recent activity
      const recentActivity = await this.getTeamRecentActivity(teamId);

      return {
        // Basic info
        teamId: team.id,
        teamName: team.name,
        teamStatus: team.status,
        teamType: team.team_type,
        
        // Relationship validation
        hasValidLocation,
        hasValidProvider,
        relationshipHealth,
        
        // Location info
        locationId: team.location_id,
        locationName: team.locations?.name || null,
        locationCity: team.locations?.city || null,
        locationState: team.locations?.state || null,
        
        // Provider info
        providerId: team.provider_id,
        providerName: team.authorized_providers?.name || null,
        providerType: team.authorized_providers?.provider_type || null,
        
        // Member metrics
        totalMembers,
        activeMembers: activeMemberCount,
        adminMembers,
        membersByRole,
        
        // Performance metrics
        ...performanceMetrics,
        
        // Health
        issues,
        recommendations,
        warnings,
        
        // Details
        memberDetails,
        recentActivity
      };
    } catch (error) {
      console.error('Error getting enhanced team metrics:', error);
      throw error;
    }
  }

  private static async validateTeamAccess(teamId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is SA/AD (full access)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (profile?.role && ['SA', 'AD'].includes(profile.role)) {
        return true;
      }

      // Check if user is a member of this team
      const { data: membership } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      return !!membership;
    } catch (error) {
      console.error('Error validating team access:', error);
      return false;
    }
  }

  private static async getTeamPerformanceMetrics(teamId: string, locationId: string | null) {
    try {
      let certificatesIssued = 0;
      let coursesCompleted = 0;

      // Get certificates for team's location if available
      if (locationId) {
        const { data: certificates } = await supabase
          .from('certificates')
          .select('id, status')
          .eq('location_id', locationId);

        certificatesIssued = certificates?.filter(c => c.status === 'ACTIVE').length || 0;
      }

      // Get course completion data
      const { data: courseData } = await supabase
        .from('course_offerings')
        .select('id, status')
        .eq('team_id', teamId);

      coursesCompleted = courseData?.filter(c => c.status === 'COMPLETED').length || 0;

      // Calculate performance scores
      const averagePerformance = this.calculateAveragePerformance({
        certificatesIssued,
        coursesCompleted,
        memberCount: 0 // Will be filled in by caller
      });

      const complianceScore = this.calculateComplianceScore({
        certificatesIssued,
        coursesCompleted
      });

      return {
        certificatesIssued,
        coursesCompleted,
        averagePerformance,
        complianceScore
      };
    } catch (error) {
      console.error('Error getting team performance metrics:', error);
      return {
        certificatesIssued: 0,
        coursesCompleted: 0,
        averagePerformance: 0,
        complianceScore: 0
      };
    }
  }

  private static async getTeamRecentActivity(teamId: string): Promise<Array<{
    type: string;
    description: string;
    timestamp: string;
    userId?: string;
  }>> {
    try {
      // Get recent team member changes
      const { data: memberChanges } = await supabase
        .from('team_members')
        .select(`
          id, user_id, role, status, created_at, updated_at,
          profiles(display_name)
        `)
        .eq('team_id', teamId)
        .order('updated_at', { ascending: false })
        .limit(10);

      const activity: Array<{
        type: string;
        description: string;
        timestamp: string;
        userId?: string;
      }> = [];

      memberChanges?.forEach(change => {
        const userName = change.profiles?.display_name || 'Unknown User';
        activity.push({
          type: 'member_update',
          description: `${userName} ${change.status === 'active' ? 'joined' : 'left'} the team`,
          timestamp: change.updated_at || change.created_at,
          userId: change.user_id
        });
      });

      return activity.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ).slice(0, 5);
    } catch (error) {
      console.error('Error getting team recent activity:', error);
      return [];
    }
  }

  private static calculateAveragePerformance(data: {
    certificatesIssued: number;
    coursesCompleted: number;
    memberCount: number;
  }): number {
    if (data.memberCount === 0) return 0;
    
    const certScore = Math.min(100, (data.certificatesIssued / Math.max(1, data.memberCount)) * 20);
    const courseScore = Math.min(100, (data.coursesCompleted / Math.max(1, data.memberCount)) * 30);
    
    return Math.round((certScore + courseScore) / 2);
  }

  private static calculateComplianceScore(data: {
    certificatesIssued: number;
    coursesCompleted: number;
  }): number {
    // Simple compliance calculation based on activity
    const baseScore = 60;
    const certBonus = Math.min(30, data.certificatesIssued * 2);
    const courseBonus = Math.min(10, data.coursesCompleted * 1);
    
    return Math.min(100, baseScore + certBonus + courseBonus);
  }

  private static generateHealthAssessment(data: any): {
    issues: string[];
    recommendations: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Relationship issues
    if (!data.hasValidLocation) {
      issues.push('Team has no valid location assignment');
      recommendations.push('Assign team to a valid location for proper regional management');
    }

    if (!data.hasValidProvider) {
      issues.push('Team has no valid provider assignment');
      recommendations.push('Assign an authorized provider to oversee team activities');
    }

    // Membership issues
    if (data.totalMembers === 0) {
      issues.push('Team has no active members');
      recommendations.push('Add members to the team to begin activities');
    } else if (data.totalMembers < 3) {
      warnings.push('Team has very few members');
      recommendations.push('Consider adding more members for better collaboration');
    }

    // Performance issues
    if (data.certificatesIssued === 0) {
      warnings.push('No certificates issued');
      recommendations.push('Encourage team members to complete certification training');
    }

    if (data.coursesCompleted === 0) {
      warnings.push('No courses completed');
      recommendations.push('Schedule and complete training courses');
    }

    if (data.averagePerformance < 50) {
      issues.push('Low team performance score');
      recommendations.push('Review team goals and provide additional support');
    } else if (data.averagePerformance < 75) {
      warnings.push('Below-average team performance');
      recommendations.push('Focus on improving training completion rates');
    }

    return { issues, recommendations, warnings };
  }
}
