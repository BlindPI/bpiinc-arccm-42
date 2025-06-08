
import { supabase } from '@/integrations/supabase/client';
import type { TeamAnalytics, TeamPerformanceMetrics } from '@/types/team-management';

export class RealTeamAnalyticsService {
  static async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    try {
      // Get real team analytics from database function
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;

      if (data && typeof data === 'object') {
        return {
          totalTeams: data.total_teams || 0,
          totalMembers: data.total_members || 0,
          averagePerformance: data.performance_average || 0,
          averageCompliance: data.compliance_score || 0,
          teamsByLocation: data.teamsByLocation || {},
          performanceByTeamType: data.performanceByTeamType || {}
        };
      }

      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    }
  }

  static async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    try {
      // Calculate real performance metrics for the team
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // Last 3 months
      const endDate = new Date();

      // Get team details with location
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          locations(name)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get certificates issued by team location
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('*')
        .eq('location_id', team.location_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (certError) throw certError;

      // Get courses conducted at team location
      const { data: courses, error: courseError } = await supabase
        .from('course_offerings')
        .select('*')
        .eq('location_id', team.location_id)
        .gte('start_date', startDate.toISOString())
        .lte('start_date', endDate.toISOString());

      if (courseError) throw courseError;

      // Calculate compliance score from actual compliance issues
      const { data: complianceIssues, error: complianceError } = await supabase
        .from('compliance_issues')
        .select('status')
        .in('user_id', await this.getTeamMemberIds(teamId));

      if (complianceError) throw complianceError;

      const totalIssues = complianceIssues?.length || 0;
      const resolvedIssues = complianceIssues?.filter(issue => issue.status === 'RESOLVED').length || 0;
      const complianceScore = totalIssues === 0 ? 100 : (resolvedIssues / totalIssues) * 100;

      return {
        team_id: teamId,
        location_name: team.locations?.name,
        totalCertificates: certificates?.length || 0,
        totalCourses: courses?.length || 0,
        averageSatisfaction: 85.0, // Would need satisfaction survey data
        complianceScore: complianceScore,
        performanceTrend: team.performance_score || 0,
        total_certificates: certificates?.length || 0,
        total_courses: courses?.length || 0,
        avg_satisfaction: 85.0,
        compliance_score: complianceScore,
        performance_trend: team.performance_score || 0
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return null;
    }
  }

  static async getLocationAnalytics(): Promise<Record<string, any>> {
    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          teams(id, performance_score),
          certificates(id),
          course_offerings(id)
        `);

      if (error) throw error;

      const analytics = {};
      for (const location of locations || []) {
        analytics[location.name] = {
          teamCount: location.teams?.length || 0,
          avgPerformance: location.teams?.length > 0 
            ? location.teams.reduce((sum, t) => sum + (t.performance_score || 0), 0) / location.teams.length
            : 0,
          certificateCount: location.certificates?.length || 0,
          courseCount: location.course_offerings?.length || 0
        };
      }

      return analytics;
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return {};
    }
  }

  private static async getTeamMemberIds(teamId: string): Promise<string[]> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

      if (error) throw error;
      return members?.map(m => m.user_id) || [];
    } catch (error) {
      console.error('Error fetching team member IDs:', error);
      return [];
    }
  }
}

export const realTeamAnalyticsService = new RealTeamAnalyticsService();
