import { supabase } from '@/integrations/supabase/client';
import { Team, TeamMemberWithProfile, EnhancedTeam } from '@/types/team-management';

export class TeamManagementService {
  static async updateTeamMemberRole(
    teamId: string, 
    userId: string, 
    newRole: 'MEMBER' | 'ADMIN'
  ) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole, 
          updated_at: new Date().toISOString() 
        })
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team member role:', error);
      throw error;
    }
  }

  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            display_name,
            role,
            status
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  static async createTeam(teamData: Partial<Team>): Promise<Team | null> {
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

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations:location_id (
            id,
            name,
            address,
            city,
            state
          ),
          authorized_providers:provider_id (
            id,
            name,
            provider_type,
            status
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        location: team.locations,
        provider: team.authorized_providers,
        metrics: {
          performance_score: team.performance_score || 0,
          compliance_score: 85,
          member_count: 0
        }
      }));
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }
}

// Keep the default export for compatibility
export const teamManagementService = TeamManagementService;
