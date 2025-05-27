
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
      const { error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          id,
          team_id,
          location_id,
          assignment_type,
          start_date,
          end_date,
          locations!team_location_assignments_location_id_fkey(
            name
          )
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: parseAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        location_name: assignment.locations?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          location_assignment: locationId,
          team_position: position,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member location:', error);
      throw error;
    }
  }
}
