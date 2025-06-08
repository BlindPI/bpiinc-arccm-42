
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';

export class RealTeamDataService {
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;
      
      return data.map((item: any) => item.team_data);
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      // Return empty array instead of mock data
      return [];
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;
      
      return {
        totalTeams: data.total_teams || 0,
        totalMembers: data.total_members || 0,
        averagePerformance: data.performance_average || 0,
        averageCompliance: data.compliance_score || 0,
        teamsByLocation: data.teamsByLocation || {},
        performanceByTeamType: data.performanceByTeamType || {}
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      // Return real zero state instead of mock data
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

  static async getTeamPerformanceMetrics(teamId: string) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      // Return real zero state
      return {
        certificates_issued: 0,
        courses_conducted: 0,
        member_count: 0,
        compliance_score: 0,
        average_satisfaction_score: 0,
        member_retention_rate: 0,
        training_hours_delivered: 0
      };
    }
  }

  static async getWorkflowStatistics() {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching workflow statistics:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    }
  }
}
