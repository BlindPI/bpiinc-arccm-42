
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
            created_at,
            updated_at,
            assignment_start_date,
            assignment_end_date,
            team_position,
            location_assignment,
            permissions,
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
    created_by: string;
  }): Promise<EnhancedTeam> {
    try {
      // Create the team first
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.location_id,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          team_type: teamData.team_type || 'provider_team',
          status: 'active',
          created_by: teamData.created_by
        })
        .select(`
          *,
          location:locations!fk_teams_location_id(*),
          provider:authorized_providers!fk_teams_provider_id(*),
          members:team_members!fk_team_members_team_id(
            id,
            user_id,
            role,
            created_at,
            updated_at,
            assignment_start_date,
            assignment_end_date,
            team_position,
            location_assignment,
            permissions,
            profile:profiles!fk_team_members_user_id(*)
          )
        `)
        .single();

      if (teamError) throw teamError;

      // Explicitly create the team member entry for the creator
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: teamData.created_by,
          role: 'ADMIN',
          permissions: { 
            admin: true, 
            manage_members: true,
            manage_team: true,
            view_analytics: true 
          },
          assignment_start_date: new Date().toISOString(),
          team_position: 'Team Creator'
        });

      if (memberError) {
        console.error('Team member creation error:', memberError);
        // Clean up the team if member creation fails
        await supabase.from('teams').delete().eq('id', team.id);
        throw new Error(`Failed to add team creator as member: ${memberError.message}`);
      }
      
      return {
        ...team,
        provider_id: team.provider_id ? team.provider_id.toString() : undefined,
        metadata: team.metadata as any,
        current_metrics: team.current_metrics as any,
        monthly_targets: team.monthly_targets as any
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
            created_at,
            updated_at,
            assignment_start_date,
            assignment_end_date,
            team_position,
            location_assignment,
            permissions,
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
            created_at,
            updated_at,
            assignment_start_date,
            assignment_end_date,
            team_position,
            location_assignment,
            permissions,
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
