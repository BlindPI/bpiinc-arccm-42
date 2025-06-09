
import { supabase } from '@/integrations/supabase/client';
import type { RealTeam, TeamAnalytics, TeamPerformanceMetrics } from './realTeamService';

export class RealTeamDataService {
  // Get all teams using the real database function
  static async getEnhancedTeams(): Promise<RealTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) {
        console.error('Error fetching enhanced teams:', error);
        throw error;
      }
      
      return (data || []).map((item: any) => {
        const teamData = this.safeParseJsonResponse(item.team_data);
        return {
          ...teamData,
          metadata: this.safeParseJsonResponse(teamData.metadata),
          monthly_targets: this.safeParseJsonResponse(teamData.monthly_targets),
          current_metrics: this.safeParseJsonResponse(teamData.current_metrics),
          member_count: teamData.member_count || 0
        } as RealTeam;
      });
    } catch (error) {
      console.error('Failed to fetch enhanced teams:', error);
      throw error;
    }
  }

  // Get team analytics using real database function
  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }
      
      const analyticsData = this.safeParseJsonResponse(data);
      
      return {
        totalTeams: analyticsData.total_teams || 0,
        totalMembers: analyticsData.total_members || 0,
        averagePerformance: analyticsData.performance_average || 0,
        averageCompliance: analyticsData.compliance_score || 0,
        teamsByLocation: analyticsData.teamsByLocation || {},
        performanceByTeamType: analyticsData.performanceByTeamType || {}
      };
    } catch (error) {
      console.error('Failed to fetch team analytics:', error);
      throw error;
    }
  }

  // Get team performance metrics using real database function
  static async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      const metricsData = this.safeParseJsonResponse(data);
      
      return {
        team_id: teamId,
        certificates_issued: metricsData.certificates_issued || 0,
        courses_conducted: metricsData.courses_conducted || 0,
        average_satisfaction_score: metricsData.average_satisfaction_score || 0,
        compliance_score: metricsData.compliance_score || 0,
        member_retention_rate: metricsData.member_retention_rate || 0,
        training_hours_delivered: metricsData.training_hours_delivered || 0
      };
    } catch (error) {
      console.error('Failed to fetch team performance metrics:', error);
      throw error;
    }
  }

  // Get cross-team analytics using real database function
  static async getCrossTeamAnalytics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cross_team_analytics');
      
      if (error) throw error;
      
      return this.safeParseJsonResponse(data);
    } catch (error) {
      console.error('Failed to fetch cross-team analytics:', error);
      return {};
    }
  }

  // Get compliance metrics using real database function
  static async getComplianceMetrics(): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_compliance_metrics');
      
      if (error) throw error;
      
      return this.safeParseJsonResponse(data);
    } catch (error) {
      console.error('Failed to fetch compliance metrics:', error);
      return {};
    }
  }

  // Helper function to safely parse JSON responses
  private static safeParseJsonResponse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data || {};
  }
}
