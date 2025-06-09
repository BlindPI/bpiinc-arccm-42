
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';

export class RealTeamDataService {
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => item.team_data);
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;
      
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

  static async getTeamPerformanceMetrics(teamId: string): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
        p_end_date: new Date().toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      return this.safeParseJsonResponse(data);
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return {};
    }
  }

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

// Export instance for compatibility
export const realTeamDataService = new RealTeamDataService();
