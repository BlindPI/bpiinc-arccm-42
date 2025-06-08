
import { supabase } from '@/integrations/supabase/client';

export interface TeamAnalyticsData {
  teamId: string;
  teamName: string;
  performance: number;
  members: number;
  certificates: number;
  courses: number;
  location: string;
}

export interface LocationAnalyticsData {
  locationId: string;
  locationName: string;
  teams: number;
  members: number;
  avgPerformance: number;
}

export interface TeamTypeDistribution {
  teamType: string;
  count: number;
  percentage: number;
}

export class EnterpriseAnalyticsService {
  async getTeamPerformanceData(): Promise<TeamAnalyticsData[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          performance_score,
          location_id,
          locations(name),
          team_members(count),
          certificates(count),
          course_offerings(count)
        `)
        .eq('status', 'active');

      if (error) throw error;

      return teams.map(team => ({
        teamId: team.id,
        teamName: team.name,
        performance: team.performance_score || 0,
        members: team.team_members?.[0]?.count || 0,
        certificates: team.certificates?.[0]?.count || 0,
        courses: team.course_offerings?.[0]?.count || 0,
        location: team.locations?.name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching team performance data:', error);
      return [];
    }
  }

  async getLocationAnalytics(): Promise<LocationAnalyticsData[]> {
    try {
      const { data: locations, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          teams(
            id,
            performance_score,
            team_members(count)
          )
        `);

      if (error) throw error;

      return locations.map(location => {
        const teams = location.teams || [];
        const totalMembers = teams.reduce((sum, team) => 
          sum + (team.team_members?.[0]?.count || 0), 0
        );
        const avgPerformance = teams.length > 0
          ? teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length
          : 0;

        return {
          locationId: location.id,
          locationName: location.name,
          teams: teams.length,
          members: totalMembers,
          avgPerformance: Math.round(avgPerformance)
        };
      });
    } catch (error) {
      console.error('Error fetching location analytics:', error);
      return [];
    }
  }

  async getTeamTypeDistribution(): Promise<TeamTypeDistribution[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('team_type')
        .eq('status', 'active');

      if (error) throw error;

      const typeCount = teams.reduce((acc, team) => {
        const type = team.team_type || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = teams.length;
      
      return Object.entries(typeCount).map(([type, count]) => ({
        teamType: type.replace('_', ' '),
        count,
        percentage: Math.round((count / total) * 100)
      }));
    } catch (error) {
      console.error('Error fetching team type distribution:', error);
      return [];
    }
  }

  async getSystemMetrics() {
    try {
      const [teamData, locationData, typeDistribution] = await Promise.all([
        this.getTeamPerformanceData(),
        this.getLocationAnalytics(),
        this.getTeamTypeDistribution()
      ]);

      const totalTeams = teamData.length;
      const totalMembers = teamData.reduce((sum, team) => sum + team.members, 0);
      const avgPerformance = teamData.length > 0
        ? Math.round(teamData.reduce((sum, team) => sum + team.performance, 0) / teamData.length)
        : 0;
      const activeLocations = locationData.length;

      return {
        totalTeams,
        totalMembers,
        avgPerformance,
        activeLocations,
        teamData,
        locationData,
        typeDistribution
      };
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      throw error;
    }
  }
}

export const enterpriseAnalyticsService = new EnterpriseAnalyticsService();
