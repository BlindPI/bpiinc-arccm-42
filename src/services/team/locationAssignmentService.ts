
import { supabase } from '@/integrations/supabase/client';
import type { TeamLocationAssignment } from '@/types/team-management';

export class LocationAssignmentService {
  static async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          location:locations!team_location_assignments_location_id_fkey(name)
        `)
        .eq('team_id', teamId)
        .order('start_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(assignment => ({
        id: assignment.id,
        team_id: assignment.team_id || '',
        location_id: assignment.location_id || '',
        assignment_type: this.validateAssignmentType(assignment.assignment_type),
        start_date: assignment.start_date || new Date().toISOString(),
        end_date: assignment.end_date,
        created_at: assignment.created_at || new Date().toISOString(),
        updated_at: assignment.updated_at || assignment.created_at || new Date().toISOString(),
        location_name: assignment.location?.name
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
          end_date: endDate,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id,
        team_id: data.team_id || '',
        location_id: data.location_id || '',
        assignment_type: this.validateAssignmentType(data.assignment_type),
        start_date: data.start_date || new Date().toISOString(),
        end_date: data.end_date,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || data.created_at || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  private static validateAssignmentType(type: string | null): 'primary' | 'secondary' | 'temporary' {
    if (type === 'primary' || type === 'secondary' || type === 'temporary') {
      return type;
    }
    return 'primary'; // Default fallback
  }
}
