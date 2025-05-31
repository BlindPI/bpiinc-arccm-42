
import { supabase } from '@/integrations/supabase/client';
import type { TeamLocationAssignment } from './types';
import { parseAssignmentType } from './utils';

export class LocationAssignmentService {
  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    try {
      // For now, we'll just update the team's location_id directly
      // since team_location_assignments table doesn't exist yet
      const { error } = await supabase
        .from('teams')
        .update({
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      // Since team_location_assignments doesn't exist, get from teams table
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          location_id,
          created_at,
          updated_at,
          locations!inner(
            name
          )
        `)
        .eq('id', teamId);

      if (error) throw error;

      return (data || []).map((team, index) => ({
        id: `${team.id}-assignment-${index}`,
        team_id: team.id,
        location_id: team.location_id || '',
        assignment_type: 'primary' as const,
        start_date: team.created_at || new Date().toISOString(),
        end_date: undefined,
        created_at: team.created_at || new Date().toISOString(),
        updated_at: team.updated_at || new Date().toISOString(),
        location_name: (team.locations as any)?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    try {
      const updateData: any = {
        location_assignment: locationId,
        updated_at: new Date().toISOString()
      };

      if (position !== undefined) {
        updateData.team_position = position;
      }

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member location:', error);
      throw error;
    }
  }
}
