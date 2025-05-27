import { supabase } from '@/integrations/supabase/client';
import { EnhancedTeam } from './types';
import { parseJsonObject, parseTeamStatus } from './utils';

export class TeamOperations {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      // Use specific column hint to resolve ambiguous relationships
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!teams_location_id_fkey(*),
          provider:authorized_providers!teams_provider_id_fkey(*),
          team_members(
            *,
            profile:profiles!team_members_user_id_fkey(*)
          )
        `)
        .order('name');

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      return teams.map(team => this.transformTeamData(team));
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
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to create a team');
      }

      // Create the team with enhanced fields
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.location_id || null,
          provider_id: teamData.provider_id ? parseInt(teamData.provider_id) : null,
          team_type: teamData.team_type || 'operational',
          status: 'active',
          performance_score: 0.00,
          monthly_targets: {},
          current_metrics: {},
          created_by: user.id
        })
        .select(`
          *,
          location:locations!teams_location_id_fkey(*),
          provider:authorized_providers!teams_provider_id_fkey(*)
        `)
        .single();

      if (teamError) {
        console.error('Team creation error:', teamError);
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      // Add the creator as team admin
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          role: 'ADMIN',
          permissions: { admin: true },
          assignment_start_date: new Date().toISOString()
        });

      if (memberError) {
        console.error('Team member creation error:', memberError);
        // Try to clean up the team if member creation failed
        await supabase.from('teams').delete().eq('id', newTeam.id);
        throw new Error(`Failed to add team admin: ${memberError.message}`);
      }

      // Fetch the complete team data with members
      return await this.getTeamById(newTeam.id);
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async getTeamById(teamId: string): Promise<EnhancedTeam> {
    try {
      const { data: team, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!teams_location_id_fkey(*),
          provider:authorized_providers!teams_provider_id_fkey(*),
          team_members(
            *,
            profile:profiles!team_members_user_id_fkey(*)
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      if (!team) throw new Error('Team not found');

      return this.transformTeamData(team);
    } catch (error) {
      console.error('Error fetching team by ID:', error);
      throw error;
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations!teams_location_id_fkey(*),
          provider:authorized_providers!teams_provider_id_fkey(*),
          team_members(
            *,
            profile:profiles!team_members_user_id_fkey(*)
          )
        `)
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      if (!teams || teams.length === 0) return [];

      return teams.map(team => this.transformTeamData(team));
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }

  private transformTeamData(team: any): EnhancedTeam {
    return {
      id: team.id,
      name: team.name || '',
      description: team.description,
      location_id: team.location_id,
      provider_id: team.provider_id?.toString(),
      team_type: team.team_type || 'operational',
      status: parseTeamStatus(team.status),
      performance_score: team.performance_score || 0,
      monthly_targets: parseJsonObject(team.monthly_targets),
      current_metrics: parseJsonObject(team.current_metrics),
      created_at: team.created_at || '',
      updated_at: team.updated_at || '',
      created_by: team.created_by,
      location: team.location ? {
        id: team.location.id,
        name: team.location.name,
        address: team.location.address,
        city: team.location.city,
        state: team.location.state
      } : undefined,
      provider: team.provider ? {
        id: team.provider.id.toString(),
        name: team.provider.name,
        provider_type: team.provider.provider_type
      } : undefined,
      members: (team.team_members || []).map((member: any) => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role,
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        permissions: parseJsonObject(member.permissions),
        created_at: member.created_at || '',
        updated_at: member.updated_at || '',
        profile: member.profile ? {
          id: member.profile.id,
          display_name: member.profile.display_name,
          role: member.profile.role,
          email: member.profile.email
        } : undefined
      }))
    };
  }
}
