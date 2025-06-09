
import { supabase } from '@/integrations/supabase/client';
import type { 
  Team, 
  TeamMemberWithProfile, 
  CreateTeamRequest, 
  TeamLocationAssignment 
} from '@/types/team-management';

export class TeamManagementService {
  // Fixed: Added missing getAllTeams method
  static async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all teams:', error);
      return [];
    }
  }

  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:user_id (
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  // Fixed: Updated method signature to match usage
  static async updateMemberRole(memberId: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  // Fixed: Updated method signature to match usage
  static async removeMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  static async createTeam(teamData: CreateTeamRequest): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  static async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          location:location_id (
            id,
            name,
            city,
            state
          )
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []).map(assignment => ({
        ...assignment,
        location_name: assignment.location?.name
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  // Fixed: Updated assignment type to match interface
  static async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'coverage' = 'primary'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          is_active: true,
          assigned_at: new Date().toISOString(),
          start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  static async getProviderTeams(providerId: string): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      return [];
    }
  }
}

export const teamManagementService = new TeamManagementService();
