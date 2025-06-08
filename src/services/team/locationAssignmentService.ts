
import { supabase } from '@/integrations/supabase/client';
import type { TeamLocationAssignment } from '@/types/team-management';

export class LocationAssignmentService {
  static async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          locations(name)
        `)
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        ...assignment,
        location_name: assignment.locations?.name
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  static async assignTeamToLocation(
    teamId: string,
    locationId: string,
    assignmentType: 'primary' | 'secondary' | 'temporary',
    startDate: string,
    endDate?: string
  ): Promise<TeamLocationAssignment> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          start_date: startDate,
          end_date: endDate
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }
}
