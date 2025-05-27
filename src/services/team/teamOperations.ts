
import { supabase } from '@/integrations/supabase/client';
import { EnhancedTeam } from './types';
import { parseJsonObject, parseTeamStatus } from './utils';

export class TeamOperations {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      // Get teams with basic info
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name');

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) return [];

      return await this.enrichTeamsWithRelatedData(teams);
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
      const { data: teamData: newTeam, error: teamError } = await supabase
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
        .select()
        .single();

      if (teamError) {
        console.error('Team creation error:', teamError);
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      // Add the creator as team admin - this should now work with updated RLS policies
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

      return await this.enrichSingleTeamWithRelatedData(newTeam);
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) throw error;
      if (!teams || teams.length === 0) return [];

      return await this.enrichTeamsWithRelatedData(teams);
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      throw error;
    }
  }

  private async enrichTeamsWithRelatedData(teams: any[]): Promise<EnhancedTeam[]> {
    // Get locations separately
    const locationIds = teams
      .map(team => team.location_id)
      .filter(id => id !== null && id !== undefined);

    let locations: any[] = [];
    if (locationIds.length > 0) {
      const { data: locationData, error: locationError } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .in('id', locationIds);

      if (locationError) {
        console.warn('Error fetching locations:', locationError);
      } else {
        locations = locationData || [];
      }
    }

    // Get providers separately
    const providerIds = teams
      .map(team => team.provider_id)
      .filter(id => id !== null && id !== undefined);

    let providers: any[] = [];
    if (providerIds.length > 0) {
      const { data: providerData, error: providerError } = await supabase
        .from('authorized_providers')
        .select('id, name, provider_type')
        .in('id', providerIds);

      if (providerError) {
        console.warn('Error fetching providers:', providerError);
      } else {
        providers = providerData || [];
      }
    }

    // Get team members with profiles
    const teamMembers = await this.getTeamMembersForTeams(teams.map(t => t.id));

    return teams.map(team => this.buildEnhancedTeam(team, locations, providers, teamMembers));
  }

  private async enrichSingleTeamWithRelatedData(team: any): Promise<EnhancedTeam> {
    let location = undefined;
    if (team.location_id) {
      const { data: locationData } = await supabase
        .from('locations')
        .select('id, name, address, city, state')
        .eq('id', team.location_id)
        .single();
      
      if (locationData) {
        location = locationData;
      }
    }

    let provider = undefined;
    if (team.provider_id) {
      const { data: providerData } = await supabase
        .from('authorized_providers')
        .select('id, name, provider_type')
        .eq('id', team.provider_id)
        .single();
      
      if (providerData) {
        provider = providerData;
      }
    }

    const teamMembers = await this.getTeamMembersForTeams([team.id]);

    return this.buildEnhancedTeam(team, location ? [location] : [], provider ? [provider] : [], teamMembers);
  }

  private async getTeamMembersForTeams(teamIds: string[]) {
    if (teamIds.length === 0) return [];

    const { data: memberData, error: memberError } = await supabase
      .from('team_members')
      .select(`
        id,
        team_id,
        user_id,
        role,
        location_assignment,
        assignment_start_date,
        assignment_end_date,
        team_position,
        permissions,
        created_at,
        updated_at
      `)
      .in('team_id', teamIds);

    if (memberError) {
      console.warn('Error fetching team members:', memberError);
      return [];
    }

    const teamMembers = memberData || [];
    const userIds = teamMembers.map(member => member.user_id).filter(Boolean);
    let profiles: any[] = [];
    
    if (userIds.length > 0) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, role, email')
        .in('id', userIds);

      if (profileError) {
        console.warn('Error fetching profiles:', profileError);
      } else {
        profiles = profileData || [];
      }
    }

    return teamMembers.map(member => ({
      ...member,
      profile: profiles.find(p => p.id === member.user_id) || null
    }));
  }

  private buildEnhancedTeam(team: any, locations: any[], providers: any[], teamMembers: any[]): EnhancedTeam {
    const location = locations.find(l => l.id === team.location_id);
    const provider = providers.find(p => p.id === team.provider_id);
    const members = teamMembers.filter(m => m.team_id === team.id);

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
      location: location ? {
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state
      } : undefined,
      provider: provider ? {
        id: provider.id.toString(),
        name: provider.name,
        provider_type: provider.provider_type
      } : undefined,
      members: members.map((member: any) => ({
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
