
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
          locations(name)
        `)
        .eq('status', 'active');

      if (error) throw error;

      // Get team member counts
      const { data: memberCounts, error: memberError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('status', 'active');

      if (memberError) throw memberError;

      // Get certificate counts by location
      const { data: certificates, error: certError } = await supabase
        .from('certificates')
        .select('location_id')
        .eq('status', 'ACTIVE');

      if (certError) throw certError;

      // Get course counts by location
      const { data: courses, error: courseError } = await supabase
        .from('course_offerings')
        .select('location_id')
        .eq('status', 'SCHEDULED');

      if (courseError) throw courseError;

      // Count members per team
      const memberCountByTeam = memberCounts?.reduce((acc, member) => {
        acc[member.team_id] = (acc[member.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Count certificates by location
      const certCountByLocation = certificates?.reduce((acc, cert) => {
        if (cert.location_id) {
          acc[cert.location_id] = (acc[cert.location_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Count courses by location
      const courseCountByLocation = courses?.reduce((acc, course) => {
        if (course.location_id) {
          acc[course.location_id] = (acc[course.location_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      return (teams || []).map(team => ({
        teamId: team.id,
        teamName: team.name,
        performance: team.performance_score || 0,
        members: memberCountByTeam[team.id] || 0,
        certificates: certCountByLocation[team.location_id] || 0,
        courses: courseCountByLocation[team.location_id] || 0,
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
          name
        `);

      if (error) throw error;

      // Get teams by location
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, location_id, performance_score')
        .eq('status', 'active');

      if (teamsError) throw teamsError;

      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Group data by location
      const teamsByLocation = teams?.reduce((acc, team) => {
        if (team.location_id) {
          if (!acc[team.location_id]) acc[team.location_id] = [];
          acc[team.location_id].push(team);
        }
        return acc;
      }, {} as Record<string, any[]>) || {};

      const membersByTeam = members?.reduce((acc, member) => {
        acc[member.team_id] = (acc[member.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return (locations || []).map(location => {
        const locationTeams = teamsByLocation[location.id] || [];
        const totalMembers = locationTeams.reduce((sum, team) => 
          sum + (membersByTeam[team.id] || 0), 0
        );
        const avgPerformance = locationTeams.length > 0
          ? locationTeams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / locationTeams.length
          : 0;

        return {
          locationId: location.id,
          locationName: location.name,
          teams: locationTeams.length,
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

      const typeCount = (teams || []).reduce((acc, team) => {
        const type = team.team_type || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = teams?.length || 0;
      
      return Object.entries(typeCount).map(([type, count]) => ({
        teamType: type.replace('_', ' '),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
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
