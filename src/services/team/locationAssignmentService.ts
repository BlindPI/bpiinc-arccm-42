
import { supabase } from '@/integrations/supabase/client';
import { TeamLocationAssignment } from './types';
import { parseAssignmentType } from './utils';

export class LocationAssignmentService {
  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<void> {
    try {
      if (assignmentType === 'primary') {
        const { error: teamError } = await supabase
          .from('teams')
          .update({ location_id: locationId })
          .eq('id', teamId);

        if (teamError) throw teamError;
      }

      const { error: assignmentError } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: new Date().toISOString()
        });

      if (assignmentError) throw assignmentError;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select('*')
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      
      const locationIds = (data || []).map(assignment => assignment.location_id);
      let locations: any[] = [];
      
      if (locationIds.length > 0) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name')
          .in('id', locationIds);
        
        locations = locationData || [];
      }
      
      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id,
        location_id: assignment.location_id,
        assignment_type: parseAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date,
        end_date: assignment.end_date,
        location_name: locations.find(l => l.id === assignment.location_id)?.name || 'Unknown Location'
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      throw error;
    }
  }

  async updateTeamMemberLocation(memberId: string, locationId: string, position?: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          location_assignment: locationId,
          team_position: position,
          assignment_start_date: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating team member location:', error);
      throw error;
    }
  }
}
