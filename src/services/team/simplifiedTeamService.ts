
import { supabase } from '@/integrations/supabase/client';
import type { SimpleTeam, SimpleTeamMember } from '@/types/simplified-team-management';
import { getTeamPermissions } from '@/types/simplified-team-management';

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
          updated_at
        `)
        .order('created_at', { ascending: false });
      
      if (teamsError) throw teamsError;

      // Get unique location IDs
      const locationIds = [...new Set(teamsData?.filter(team => team.location_id).map(team => team.location_id))];
      let locationsData: any[] = [];
      
      if (locationIds.length > 0) {
        const { data: locations, error: locationsError } = await supabase
          .from('locations')
          .select('id, name, city, state')
          .in('id', locationIds);
          
        if (locationsError) {
          console.error('Error fetching locations:', locationsError);
        } else {
          locationsData = locations || [];
        }
      }

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
        
        // Find the location for this team
        const location = team.location_id ? locationsData.find(loc => loc.id === team.location_id) : undefined;
        
        teams.push({
          ...team,
          // Ensure status is properly typed
          status: (team.status as 'active' | 'inactive' | 'suspended') || 'active',
          location: location ? {
            id: location.id,
            name: location.name,
            city: location.city,
            state: location.state
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
        .select('*')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;

      // Get location data separately if team has location_id
      let locationData = undefined;
      if (teamData.location_id) {
        const { data: location, error: locationError } = await supabase
          .from('locations')
          .select('id, name, city, state')
          .eq('id', teamData.location_id)
          .single();
          
        if (locationError) {
          console.error('Error fetching location:', locationError);
        } else {
          locationData = location;
        }
      }

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
        // Ensure status is properly typed
        status: (teamData.status as 'active' | 'inactive' | 'suspended') || 'active',
        location: locationData ? {
          id: locationData.id,
          name: locationData.name,
          city: locationData.city,
          state: locationData.state
        } : undefined,
        members,
        member_count: members.length
      };
    } catch (error) {
      console.error('Error fetching team with members:', error);
      throw error;
    }
  }

  async updateMemberRole(memberId: string, newRole: 'MEMBER' | 'ADMIN'): Promise<void> {
    try {
      const permissions = getTeamPermissions(newRole);
      
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          permissions: permissions as any, // Cast to any for Json compatibility
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
      const permissions = getTeamPermissions(role);
      
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          permissions: permissions as any, // Cast to any for Json compatibility
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
