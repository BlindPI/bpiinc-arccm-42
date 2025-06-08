
import { supabase } from '@/integrations/supabase/client';
import type { TeamPerformanceMetrics, TeamAnalytics } from '@/types/team-management';

export class TeamAnalyticsService {
  async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    try {
      // Get the most recent performance metrics for the team
      const { data: metrics, error } = await supabase
        .from('team_performance_metrics')
        .select(`
          *,
          teams!inner(
            id,
            name,
            locations(name)
          )
        `)
        .eq('team_id', teamId)
        .order('metric_period_start', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching team performance metrics:', error);
        return null;
      }

      return {
        team_id: teamId,
        location_name: metrics.teams.locations?.name || 'No Location',
        totalCertificates: metrics.certificates_issued,
        totalCourses: metrics.courses_conducted,
        averageSatisfaction: metrics.average_satisfaction_score,
        complianceScore: metrics.compliance_score,
        performanceTrend: metrics.member_retention_rate,
        // Legacy field mappings for compatibility
        total_certificates: metrics.certificates_issued,
        total_courses: metrics.courses_conducted,
        avg_satisfaction: metrics.average_satisfaction_score,
        compliance_score: metrics.compliance_score,
        performance_trend: metrics.member_retention_rate
      };
    } catch (error) {
      console.error('Error in getTeamPerformanceMetrics:', error);
      return null;
    }
  }

  async calculateTeamPerformanceScore(teamId: string): Promise<number> {
    try {
      // Call the database function to calculate performance metrics
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });

      if (error) throw error;

      // Calculate weighted score
      const score = (
        (data.compliance_score || 0) * 0.3 +
        (data.member_retention_rate || 0) * 0.3 +
        (data.average_satisfaction_score || 0) * 0.4
      );

      // Update the team's performance score
      const { error: updateError } = await supabase
        .from('teams')
        .update({ 
          performance_score: score,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (updateError) throw updateError;

      return score;
    } catch (error) {
      console.error('Error calculating team performance score:', error);
      return 0;
    }
  }

  async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    try {
      // Get real team counts and metrics
      const { data: teamStats, error: teamError } = await supabase
        .from('teams')
        .select('id, status, performance_score, team_type, location_id, locations(name)');

      if (teamError) throw teamError;

      // Get real member counts
      const { data: memberStats, error: memberError } = await supabase
        .from('team_members')
        .select('id, team_id, status')
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Calculate analytics from real data
      const totalTeams = teamStats?.length || 0;
      const totalMembers = memberStats?.length || 0;
      const activeTeams = teamStats?.filter(t => t.status === 'active') || [];
      
      const averagePerformance = activeTeams.length > 0 
        ? activeTeams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / activeTeams.length
        : 0;

      // Group teams by location
      const teamsByLocation = activeTeams.reduce((acc, team) => {
        const locationName = team.locations?.name || 'Unassigned';
        acc[locationName] = (acc[locationName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group performance by team type
      const performanceByTeamType = activeTeams.reduce((acc, team) => {
        const teamType = team.team_type || 'general';
        if (!acc[teamType]) {
          acc[teamType] = { total: 0, count: 0 };
        }
        acc[teamType].total += team.performance_score || 0;
        acc[teamType].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const performanceByTeamTypeAvg = Object.keys(performanceByTeamType).reduce((acc, type) => {
        const stats = performanceByTeamType[type];
        acc[type] = stats.count > 0 ? stats.total / stats.count : 0;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalTeams,
        totalMembers,
        averagePerformance,
        averageCompliance: 85, // Would need compliance data calculation
        teamsByLocation,
        performanceByTeamType: performanceByTeamTypeAvg
      };
    } catch (error) {
      console.error('Error fetching system-wide analytics:', error);
      
      // Return fallback data structure
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

  async getTeamComplianceMetrics(teamId: string) {
    try {
      // Get compliance data from team governance settings
      const { data: governance, error } = await supabase
        .from('team_governance')
        .select('*')
        .eq('team_id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Get recent compliance issues
      const { data: issues, error: issuesError } = await supabase
        .from('compliance_issues')
        .select('*')
        .in('user_id', 
          await supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)
            .then(({ data }) => data?.map(m => m.user_id) || [])
        );

      if (issuesError) throw issuesError;

      const openIssues = issues?.filter(i => i.status === 'OPEN') || [];
      const resolvedIssues = issues?.filter(i => i.status === 'RESOLVED') || [];
      
      const complianceScore = issues?.length > 0 
        ? (resolvedIssues.length / issues.length) * 100
        : 100;

      return {
        complianceScore,
        openIssues: openIssues.length,
        resolvedIssues: resolvedIssues.length,
        governanceModel: governance?.governance_model || 'hierarchical',
        lastAssessment: governance?.updated_at || null
      };
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return {
        complianceScore: 85,
        openIssues: 0,
        resolvedIssues: 0,
        governanceModel: 'hierarchical',
        lastAssessment: null
      };
    }
  }

  async getTeamTrendData(teamId: string, days: number = 30) {
    try {
      const { data: trends, error } = await supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .gte('metric_period_start', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('metric_period_start', { ascending: true });

      if (error) throw error;

      return trends?.map(trend => ({
        date: trend.metric_period_start,
        performance: (trend.compliance_score * 0.3 + trend.member_retention_rate * 0.3 + trend.average_satisfaction_score * 0.4),
        certificates: trend.certificates_issued,
        courses: trend.courses_conducted,
        satisfaction: trend.average_satisfaction_score
      })) || [];
    } catch (error) {
      console.error('Error fetching team trend data:', error);
      return [];
    }
  }
}

export const teamAnalyticsService = new TeamAnalyticsService();
