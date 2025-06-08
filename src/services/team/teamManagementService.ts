
import { supabase } from '@/integrations/supabase/client';
import { realTeamDataService } from './realTeamDataService';
import { realTeamAnalyticsService } from './realTeamAnalyticsService';
import type { EnhancedTeam, CreateTeamRequest, TeamAnalytics } from '@/types/team-management';

export class TeamManagementService {
  // Enhanced Teams - No Mock Data
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    return realTeamDataService.getEnhancedTeams();
  }

  async getAllEnhancedTeams(): Promise<EnhancedTeam[]> {
    return realTeamDataService.getEnhancedTeams();
  }

  async getEnhancedTeam(teamId: string): Promise<EnhancedTeam | null> {
    return realTeamDataService.getEnhancedTeam(teamId);
  }

  // System Analytics - Real Data
  async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    return realTeamAnalyticsService.getSystemWideAnalytics();
  }

  // Team Creation - Real Implementation
  async createTeam(teamData: CreateTeamRequest): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          team_type: teamData.team_type,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id?.toString(),
          created_by: teamData.created_by,
          metadata: teamData.metadata || {},
          status: 'active',
          performance_score: 0
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async createTeamWithLocation(teamData: any): Promise<string> {
    return this.createTeam(teamData);
  }

  // Team Updates - Real Implementation
  async updateTeam(teamId: string, updates: Partial<EnhancedTeam>): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
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
    return realTeamAnalyticsService.getLocationAnalytics();
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
}

export const teamManagementService = new TeamManagementService();
