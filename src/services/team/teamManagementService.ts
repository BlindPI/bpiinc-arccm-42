import { supabase } from '@/integrations/supabase/client';
import { RealTeamDataService } from './realTeamDataService';
import { RealTeamAnalyticsService } from './realTeamAnalyticsService';
import type { EnhancedTeam, CreateTeamRequest, TeamAnalytics, Team, TeamLocationAssignment } from '@/types/team-management';

export class TeamManagementService {
  // Enhanced Teams - No Mock Data
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    return RealTeamDataService.getEnhancedTeams();
  }

  async getAllEnhancedTeams(): Promise<EnhancedTeam[]> {
    return RealTeamDataService.getEnhancedTeams();
  }

  async getEnhancedTeam(teamId: string): Promise<EnhancedTeam | null> {
    return RealTeamDataService.getEnhancedTeam(teamId);
  }

  // System Analytics - Real Data
  async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    return RealTeamAnalyticsService.getSystemWideAnalytics();
  }

  // Team Creation - Real Implementation
  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          created_by: teamData.created_by,
          metadata: teamData.metadata || {},
          status: 'active',
          performance_score: 0
        })
        .select()
        .single();

      if (error) throw error;
      
      // Convert to Team type with proper type handling
      return {
        ...data,
        provider_id: data.provider_id?.toString(),
        status: data.status as 'active' | 'inactive' | 'suspended',
        metadata: (data.metadata as Record<string, any>) || {},
        monthly_targets: (data.monthly_targets as Record<string, any>) || {},
        current_metrics: (data.current_metrics as Record<string, any>) || {}
      };
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async createTeamWithLocation(teamData: any): Promise<string> {
    const team = await this.createTeam(teamData);
    return team.id;
  }

  // Team Updates - Real Implementation
  async updateTeam(teamId: string, updates: Partial<EnhancedTeam>): Promise<void> {
    try {
      // Clean the updates object to match database schema
      const cleanUpdates: any = {
        updated_at: new Date().toISOString()
      };

      // Only include fields that exist in the database schema
      if (updates.name) cleanUpdates.name = updates.name;
      if (updates.description) cleanUpdates.description = updates.description;
      if (updates.team_type) cleanUpdates.team_type = updates.team_type;
      if (updates.status) cleanUpdates.status = updates.status;
      if (updates.location_id) cleanUpdates.location_id = updates.location_id;
      if (updates.provider_id) cleanUpdates.provider_id = parseInt(updates.provider_id);
      if (updates.metadata) cleanUpdates.metadata = updates.metadata;
      if (updates.monthly_targets) cleanUpdates.monthly_targets = updates.monthly_targets;
      if (updates.current_metrics) cleanUpdates.current_metrics = updates.current_metrics;
      if (updates.performance_score !== undefined) cleanUpdates.performance_score = updates.performance_score;

      const { error } = await supabase
        .from('teams')
        .update(cleanUpdates)
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  // Team Deletion - Real Implementation
  async deleteTeam(teamId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  }

  // Location Analytics - Real Data
  async getLocationAnalytics(): Promise<Record<string, any>> {
    return RealTeamAnalyticsService.getLocationAnalytics();
  }

  // Provider Management - Real Implementation
  async assignProviderToTeam(
    providerId: string, 
    teamId: string, 
    assignmentRole: string = 'primary_provider'
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('assign_provider_to_team', {
        p_provider_id: parseInt(providerId),
        p_team_id: teamId,
        p_assignment_role: assignmentRole,
        p_oversight_level: 'standard',
        p_assigned_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  // Real Team Statistics
  async getTeamStatistics(): Promise<Record<string, number>> {
    try {
      const { data: teamStats, error } = await supabase
        .from('teams')
        .select('status, team_type');

      if (error) throw error;

      const stats = {
        total: teamStats?.length || 0,
        active: teamStats?.filter(t => t.status === 'active').length || 0,
        inactive: teamStats?.filter(t => t.status === 'inactive').length || 0,
        suspended: teamStats?.filter(t => t.status === 'suspended').length || 0
      };

      // Group by team type
      const typeGroups = teamStats?.reduce((acc, team) => {
        acc[team.team_type] = (acc[team.team_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return { ...stats, ...typeGroups };
    } catch (error) {
      console.error('Error fetching team statistics:', error);
      return { total: 0, active: 0, inactive: 0, suspended: 0 };
    }
  }

  // Missing methods that components expect
  async getAllTeams(): Promise<EnhancedTeam[]> {
    return this.getEnhancedTeams();
  }

  async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .eq('provider_id', parseInt(providerId));

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id?.toString(),
        status: team.status as 'active' | 'inactive' | 'suspended',
        metadata: (team.metadata as Record<string, any>) || {},
        monthly_targets: (team.monthly_targets as Record<string, any>) || {},
        current_metrics: (team.current_metrics as Record<string, any>) || {},
        location: team.locations,
        member_count: team.team_members?.length || 0,
        members: team.team_members?.map((member: any) => ({
          ...member,
          role: member.role as 'MEMBER' | 'ADMIN',
          status: member.status as 'active' | 'inactive' | 'suspended' | 'on_leave',
          permissions: member.permissions || {},
          display_name: member.profiles?.display_name || 'Unknown User',
          last_activity: member.last_activity || member.updated_at,
          profiles: member.profiles
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      return [];
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .eq('location_id', locationId);

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id?.toString(),
        status: team.status as 'active' | 'inactive' | 'suspended',
        metadata: (team.metadata as Record<string, any>) || {},
        monthly_targets: (team.monthly_targets as Record<string, any>) || {},
        current_metrics: (team.current_metrics as Record<string, any>) || {},
        location: team.locations,
        member_count: team.team_members?.length || 0,
        members: team.team_members?.map((member: any) => ({
          ...member,
          role: member.role as 'MEMBER' | 'ADMIN',
          status: member.status as 'active' | 'inactive' | 'suspended' | 'on_leave',
          permissions: member.permissions || {},
          display_name: member.profiles?.display_name || 'Unknown User',
          last_activity: member.last_activity || member.updated_at,
          profiles: member.profiles
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      return [];
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_member_assignments')
        .select(`
          *,
          locations(name)
        `)
        .eq('team_member_id', teamId);

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: teamId, // Add the missing team_id
        location_id: assignment.location_id,
        assignment_type: assignment.assignment_type as 'primary' | 'secondary' | 'temporary',
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        location_name: assignment.locations?.name
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_member_assignments')
        .insert({
          team_member_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getTeamPerformanceMetrics(teamId: string): Promise<any> {
    return RealTeamAnalyticsService.getTeamPerformanceMetrics(teamId);
  }
}

export const teamManagementService = new TeamManagementService();
