
import { supabase } from '@/integrations/supabase/client';
import type { SimpleTeam, SimpleTeamMember, getTeamPermissions } from '@/types/simplified-team-management';

export class SimplifiedTeamService {
  async getTeamsWithMembers(): Promise<SimpleTeam[]> {
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          status,
          team_type,
          performance_score,
          location_id,
          provider_id,
          created_at,
          updated_at,
          locations(id, name, city, state)
        `)
        .order('created_at', { ascending: false });
      
      if (teamsError) throw teamsError;

      const teams: SimpleTeam[] = [];
      
      for (const team of teamsData || []) {
        // Get member count
        const { count, error: countError } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);
        
        if (countError) {
          console.error('Error getting member count for team:', team.id, countError);
        }
        
        teams.push({
          ...team,
          location: team.locations ? {
            id: team.locations.id,
            name: team.locations.name,
            city: team.locations.city,
            state: team.locations.state
          } : undefined,
          member_count: count || 0
        });
      }
      
      return teams;
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  }

  async getTeamWithMembers(teamId: string): Promise<SimpleTeam> {
    try {
      // Get team data
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          locations(id, name, city, state)
        `)
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles!inner(id, display_name, email, role)
        `)
        .eq('team_id', teamId);

      if (membersError) throw membersError;

      // Transform members to simplified format
      const members: SimpleTeamMember[] = membersData?.map(member => {
        const teamRole: 'MEMBER' | 'ADMIN' = member.role === 'ADMIN' ? 'ADMIN' : 'MEMBER';
        
        return {
          id: member.id,
          team_id: member.team_id,
          user_id: member.user_id,
          role: teamRole,
          permissions: getTeamPermissions(teamRole),
          team_position: member.team_position,
          assignment_start_date: member.assignment_start_date,
          assignment_end_date: member.assignment_end_date,
          created_at: member.created_at,
          updated_at: member.updated_at,
          display_name: member.profiles?.display_name || 'Unknown User',
          profile: member.profiles ? {
            id: member.profiles.id,
            display_name: member.profiles.display_name,
            email: member.profiles.email,
            role: member.profiles.role // System role
          } : undefined
        };
      }) || [];

      return {
        ...teamData,
        location: teamData.locations ? {
          id: teamData.locations.id,
          name: teamData.locations.name,
          city: teamData.locations.city,
          state: teamData.locations.state
        } : undefined,
        members
      };
    } catch (error) {
      console.error('Error fetching team with members:', error);
      throw error;
    }
  }

  async updateMemberRole(memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          permissions: getTeamPermissions(newRole),
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  async addTeamMember(teamId: string, userId: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          permissions: getTeamPermissions(role),
          assignment_start_date: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  async removeMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  }
}

export const simplifiedTeamService = new SimplifiedTeamService();
