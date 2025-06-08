
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';
import { safeJsonAccess, isRecord } from '@/utils/jsonUtils';

export class RealTeamDataService {
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;
      
      return data.map((item: any) => item.team_data);
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  static async getEnhancedTeam(teamId: string): Promise<EnhancedTeam | null> {
    try {
      const teams = await this.getEnhancedTeams();
      return teams.find(team => team.id === teamId) || null;
    } catch (error) {
      console.error('Error fetching enhanced team:', error);
      return null;
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;
      
      const analyticsData = data || {};
      
      return {
        totalTeams: safeJsonAccess(analyticsData, 'total_teams', 0),
        totalMembers: safeJsonAccess(analyticsData, 'total_members', 0),
        averagePerformance: safeJsonAccess(analyticsData, 'performance_average', 0),
        averageCompliance: safeJsonAccess(analyticsData, 'compliance_score', 0),
        teamsByLocation: isRecord(safeJsonAccess(analyticsData, 'teamsByLocation')) 
          ? safeJsonAccess(analyticsData, 'teamsByLocation', {})
          : {},
        performanceByTeamType: isRecord(safeJsonAccess(analyticsData, 'performanceByTeamType'))
          ? safeJsonAccess(analyticsData, 'performanceByTeamType', {})
          : {}
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
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
      
      const metricsData = data || {};
      
      return {
        certificates_issued: safeJsonAccess(metricsData, 'certificates_issued', 0),
        courses_conducted: safeJsonAccess(metricsData, 'courses_conducted', 0),
        member_count: safeJsonAccess(metricsData, 'member_count', 0),
        compliance_score: safeJsonAccess(metricsData, 'compliance_score', 0),
        average_satisfaction_score: safeJsonAccess(metricsData, 'average_satisfaction_score', 0),
        member_retention_rate: safeJsonAccess(metricsData, 'member_retention_rate', 0),
        training_hours_delivered: safeJsonAccess(metricsData, 'training_hours_delivered', 0)
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
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
      
      return data || {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
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
