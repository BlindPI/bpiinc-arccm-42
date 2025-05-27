
import { supabase } from '@/integrations/supabase/client';
import type { Team as EnhancedTeam } from '@/types/user-management';

export class TeamOperations {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!fk_teams_location_id(*),
          provider:authorized_providers!fk_teams_provider_id(*),
          members:team_members!fk_team_members_team_id(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles!fk_team_members_user_id(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the expected type
      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id ? team.provider_id.toString() : undefined,
        metadata: team.metadata as any,
        current_metrics: team.current_metrics as any,
        monthly_targets: team.monthly_targets as any
      })) as unknown as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      throw error;
    }
  }

  async createTeamWithLocation(teamData: {
    name: string;
    description?: string;
    location_id?: string;
    provider_id?: string;
    team_type?: string;
  }): Promise<EnhancedTeam> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          team_type: teamData.team_type || 'provider_team',
          status: 'active'
        })
        .select(`
          *,
          location:locations!fk_teams_location_id(*),
          provider:authorized_providers!fk_teams_provider_id(*),
          members:team_members!fk_team_members_team_id(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles!fk_team_members_user_id(*)
          )
        `)
        .single();

      if (error) throw error;
      
      return {
        ...data,
        provider_id: data.provider_id ? data.provider_id.toString() : undefined,
        metadata: data.metadata as any,
        current_metrics: data.current_metrics as any,
        monthly_targets: data.monthly_targets as any
      } as unknown as EnhancedTeam;
    } catch (error) {
      console.error('Error creating team with location:', error);
      throw error;
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!fk_teams_location_id(*),
          provider:authorized_providers!fk_teams_provider_id(*),
          members:team_members!fk_team_members_team_id(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles!fk_team_members_user_id(*)
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id ? team.provider_id.toString() : undefined,
        metadata: team.metadata as any,
        current_metrics: team.current_metrics as any,
        monthly_targets: team.monthly_targets as any
      })) as unknown as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }

  async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!fk_teams_location_id(*),
          provider:authorized_providers!fk_teams_provider_id(*),
          members:team_members!fk_team_members_team_id(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles!fk_team_members_user_id(*)
          )
        `)
        .eq('provider_id', parseInt(providerId))
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id ? team.provider_id.toString() : undefined,
        metadata: team.metadata as any,
        current_metrics: team.current_metrics as any,
        monthly_targets: team.monthly_targets as any
      })) as unknown as EnhancedTeam[];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      throw error;
    }
  }
}
