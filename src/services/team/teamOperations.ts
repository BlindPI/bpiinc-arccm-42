
import { supabase } from '@/integrations/supabase/client';
import type { Team as EnhancedTeam } from '@/types/user-management';

export class TeamOperations {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:locations(*),
          provider:authorized_providers(*),
          members:team_members(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
          provider_id: teamData.provider_id,
          team_type: teamData.team_type || 'provider_team',
          status: 'active'
        })
        .select(`
          *,
          location:locations(*),
          provider:authorized_providers(*),
          members:team_members(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles(*)
          )
        `)
        .single();

      if (error) throw error;
      return data;
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
          location:locations(*),
          provider:authorized_providers(*),
          members:team_members(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles(*)
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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
          location:locations(*),
          provider:authorized_providers(*),
          members:team_members(
            id,
            user_id,
            role,
            joined_at,
            profile:profiles(*)
          )
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      throw error;
    }
  }
}
