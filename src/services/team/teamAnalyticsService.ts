
import { supabase } from '@/integrations/supabase/client';
import type { TeamAnalytics, TeamPerformanceMetrics } from '@/types/team-management';

// Helper function to safely parse performance data from function result
function parsePerformanceData(data: any): any {
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return data || {};
}

export class TeamAnalyticsService {
  async getSystemAnalytics(): Promise<TeamAnalytics> {
    try {
      // Get basic team counts
      const { data: teamsData } = await supabase
        .from('teams')
        .select('id, status')
        .eq('status', 'active');

      const { data: membersData } = await supabase
        .from('team_members')
        .select('id, team_id');

      // Get performance scores
      const { data: performanceData } = await supabase
        .from('teams')
        .select('performance_score, team_type, location_id')
        .eq('status', 'active');

      // Calculate analytics
      const totalTeams = teamsData?.length || 0;
      const totalMembers = membersData?.length || 0;
      const averagePerformance = performanceData?.length 
        ? performanceData.reduce((sum, team) => sum + (team.performance_score || 0), 0) / performanceData.length
        : 0;

      // Get teams by location
      const teamsByLocation: Record<string, number> = {};
      const performanceByTeamType: Record<string, number> = {};

      for (const team of performanceData || []) {
        // Count by location
        if (team.location_id) {
          const { data: locationData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', team.location_id)
            .single();
          
          const locationName = locationData?.name || 'Unknown';
          teamsByLocation[locationName] = (teamsByLocation[locationName] || 0) + 1;
        }

        // Performance by team type
        if (team.team_type) {
          const current = performanceByTeamType[team.team_type] || 0;
          const count = Object.values(performanceByTeamType).length || 1;
          performanceByTeamType[team.team_type] = (current * (count - 1) + (team.performance_score || 0)) / count;
        }
      }

      return {
        totalTeams,
        totalMembers,
        averagePerformance,
        averageCompliance: 85, // Would calculate from actual compliance data
        teamsByLocation,
        performanceByTeamType
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

  async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics> {
    try {
      // Get team performance data using the database function
      const { data: performanceData, error } = await supabase.rpc(
        'calculate_team_performance_metrics',
        {
          p_team_id: teamId,
          p_start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }
      );

      if (error) throw error;

      const parsed = parsePerformanceData(performanceData);

      // Get team and location info
      const { data: teamData } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          locations(name)
        `)
        .eq('id', teamId)
        .single();

      return {
        team_id: teamId,
        location_name: teamData?.locations?.name,
        totalCertificates: parsed.certificates_issued || 0,
        totalCourses: parsed.courses_conducted || 0,
        averageSatisfaction: parsed.average_satisfaction_score || 0,
        complianceScore: parsed.compliance_score || 0,
        performanceTrend: 0, // Would calculate from historical data
        total_certificates: parsed.certificates_issued || 0,
        total_courses: parsed.courses_conducted || 0,
        avg_satisfaction: parsed.average_satisfaction_score || 0,
        compliance_score: parsed.compliance_score || 0,
        performance_trend: 0
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return {
        team_id: teamId,
        location_name: undefined,
        totalCertificates: 0,
        totalCourses: 0,
        averageSatisfaction: 0,
        complianceScore: 0,
        performanceTrend: 0,
        total_certificates: 0,
        total_courses: 0,
        avg_satisfaction: 0,
        compliance_score: 0,
        performance_trend: 0
      };
    }
  }

  async getTeamComparisonData(teamIds: string[]): Promise<TeamPerformanceMetrics[]> {
    const results: TeamPerformanceMetrics[] = [];
    
    for (const teamId of teamIds) {
      try {
        const metrics = await this.getTeamPerformanceMetrics(teamId);
        results.push(metrics);
      } catch (error) {
        console.error(`Error fetching metrics for team ${teamId}:`, error);
      }
    }

    return results;
  }

  async getLocationPerformanceData(): Promise<Record<string, TeamPerformanceMetrics[]>> {
    try {
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id,
          location_id,
          locations(name)
        `)
        .eq('status', 'active');

      const locationData: Record<string, TeamPerformanceMetrics[]> = {};

      for (const team of teams || []) {
        const locationName = team.locations?.name || 'Unknown';
        const metrics = await this.getTeamPerformanceMetrics(team.id);
        
        if (!locationData[locationName]) {
          locationData[locationName] = [];
        }
        locationData[locationName].push(metrics);
      }

      return locationData;
    } catch (error) {
      console.error('Error fetching location performance data:', error);
      return {};
    }
  }
}

export const teamAnalyticsService = new TeamAnalyticsService();
