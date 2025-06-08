
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, Location } from '@/types/team-management';

export interface LocationTeamAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: 'primary' | 'secondary' | 'temporary';
  start_date: string;
  end_date?: string;
  permissions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface LocationAnalytics {
  locationId: string;
  locationName: string;
  totalTeams: number;
  totalMembers: number;
  averagePerformance: number;
  certificatesIssued: number;
  coursesCompleted: number;
  utilizationRate: number;
}

export class LocationTeamService {
  async getLocationTeams(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations (
            id, name, address, city, state, created_at, updated_at
          ),
          authorized_providers (
            id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
          ),
          team_members (
            id, team_id, user_id, role, status, location_assignment, 
            assignment_start_date, assignment_end_date, team_position, 
            permissions, created_at, updated_at,
            profiles (
              id, display_name, email, role, created_at, updated_at
            )
          )
        `)
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;

      return (teams || []).map(team => this.transformToEnhancedTeam(team));
    } catch (error) {
      console.error('Error getting location teams:', error);
      return [];
    }
  }

  async assignTeamToLocation(
    teamId: string,
    locationId: string,
    assignmentType: 'primary' | 'secondary' | 'temporary',
    permissions: Record<string, any> = {},
    endDate?: string
  ): Promise<LocationTeamAssignment> {
    try {
      const assignment = {
        team_id: teamId,
        location_id: locationId,
        assignment_type: assignmentType,
        start_date: new Date().toISOString(),
        end_date: endDate,
        permissions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('team_location_assignments')
        .insert(assignment)
        .select()
        .single();

      if (error) throw error;

      // Update team's primary location if this is a primary assignment
      if (assignmentType === 'primary') {
        await supabase
          .from('teams')
          .update({ location_id: locationId })
          .eq('id', teamId);
      }

      return data;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getLocationAnalytics(locationId: string): Promise<LocationAnalytics> {
    try {
      // Get location details
      const { data: location } = await supabase
        .from('locations')
        .select('id, name')
        .eq('id', locationId)
        .single();

      // Get teams for this location
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id,
          performance_score,
          team_members (id)
        `)
        .eq('location_id', locationId);

      // Get certificates issued at this location
      const { data: certificates } = await supabase
        .from('certificates')
        .select('id')
        .eq('location_id', locationId);

      // Get courses completed at this location
      const { data: courses } = await supabase
        .from('course_offerings')
        .select('id')
        .eq('location_id', locationId);

      const totalTeams = teams?.length || 0;
      const totalMembers = teams?.reduce((sum, team) => sum + (team.team_members?.length || 0), 0) || 0;
      const averagePerformance = totalTeams > 0 
        ? teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / totalTeams 
        : 0;

      return {
        locationId,
        locationName: location?.name || 'Unknown Location',
        totalTeams,
        totalMembers,
        averagePerformance,
        certificatesIssued: certificates?.length || 0,
        coursesCompleted: courses?.length || 0,
        utilizationRate: this.calculateUtilizationRate(totalTeams, totalMembers)
      };
    } catch (error) {
      console.error('Error getting location analytics:', error);
      return {
        locationId,
        locationName: 'Unknown Location',
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        certificatesIssued: 0,
        coursesCompleted: 0,
        utilizationRate: 0
      };
    }
  }

  async getMultiLocationTeams(): Promise<{ team: EnhancedTeam; locations: Location[] }[]> {
    try {
      // Get teams with multiple location assignments
      const { data: assignments } = await supabase
        .from('team_location_assignments')
        .select(`
          team_id,
          locations (id, name, address, city, state, created_at, updated_at)
        `);

      if (!assignments) return [];

      // Group by team_id
      const teamLocationMap = new Map<string, Location[]>();
      assignments.forEach(assignment => {
        const teamId = assignment.team_id;
        if (!teamLocationMap.has(teamId)) {
          teamLocationMap.set(teamId, []);
        }
        if (assignment.locations) {
          teamLocationMap.get(teamId)!.push(assignment.locations as Location);
        }
      });

      // Get team details for teams with multiple locations
      const multiLocationTeamIds = Array.from(teamLocationMap.keys()).filter(
        teamId => teamLocationMap.get(teamId)!.length > 1
      );

      if (multiLocationTeamIds.length === 0) return [];

      const { data: teams } = await supabase
        .from('teams')
        .select(`
          *,
          locations (
            id, name, address, city, state, created_at, updated_at
          ),
          authorized_providers (
            id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
          ),
          team_members (
            id, team_id, user_id, role, status, location_assignment, 
            assignment_start_date, assignment_end_date, team_position, 
            permissions, created_at, updated_at,
            profiles (
              id, display_name, email, role, created_at, updated_at
            )
          )
        `)
        .in('id', multiLocationTeamIds);

      return (teams || []).map(team => ({
        team: this.transformToEnhancedTeam(team),
        locations: teamLocationMap.get(team.id) || []
      }));
    } catch (error) {
      console.error('Error getting multi-location teams:', error);
      return [];
    }
  }

  private calculateUtilizationRate(totalTeams: number, totalMembers: number): number {
    if (totalTeams === 0) return 0;
    
    // Assume optimal ratio is 5 members per team
    const optimalMembers = totalTeams * 5;
    return Math.min((totalMembers / optimalMembers) * 100, 100);
  }

  private transformToEnhancedTeam(rawTeam: any): EnhancedTeam {
    // Helper function to safely parse JSON
    const safeJsonParse = <T>(value: any, defaultValue: T): T => {
      if (value === null || value === undefined) return defaultValue;
      if (typeof value === 'object' && value !== null) return value as T;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value) as T;
        } catch {
          return defaultValue;
        }
      }
      return defaultValue;
    };

    return {
      ...rawTeam,
      provider_id: rawTeam.provider_id?.toString(),
      status: rawTeam.status as 'active' | 'inactive' | 'suspended',
      metadata: safeJsonParse(rawTeam.metadata, {}),
      monthly_targets: safeJsonParse(rawTeam.monthly_targets, {}),
      current_metrics: safeJsonParse(rawTeam.current_metrics, {}),
      location: rawTeam.locations,
      provider: rawTeam.authorized_providers ? {
        ...rawTeam.authorized_providers,
        id: rawTeam.authorized_providers.id?.toString()
      } : undefined,
      members: (rawTeam.team_members || []).map((member: any) => ({
        ...member,
        role: member.role as 'MEMBER' | 'ADMIN',
        status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
        permissions: safeJsonParse(member.permissions, {}),
        display_name: member.profiles?.display_name || member.user_id || 'Unknown'
      }))
    };
  }
}

export const locationTeamService = new LocationTeamService();
