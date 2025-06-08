
import { supabase } from '@/integrations/supabase/client';
import { TeamLocationAssignment } from '@/types/team-management';

export class LocationTeamService {
  async getLocationTeamAssignments(locationId: string): Promise<TeamLocationAssignment[]> {
    try {
      // Get teams assigned to this location
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          created_at,
          updated_at
        `)
        .eq('location_id', locationId);

      if (error) throw error;

      // Transform to LocationTeamAssignment format
      return (teams || []).map(team => ({
        id: team.id,
        team_id: team.id,
        location_id: locationId,
        assignment_type: 'primary' as const,
        start_date: team.created_at,
        end_date: undefined,
        created_at: team.created_at,
        updated_at: team.updated_at,
        location_name: undefined,
        permissions: {},
      }));
    } catch (error) {
      console.error('Error fetching location team assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary'
  ): Promise<TeamLocationAssignment> {
    try {
      // Update the team's location_id
      const { data: team, error } = await supabase
        .from('teams')
        .update({ location_id: locationId })
        .eq('id', teamId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: team.id,
        team_id: teamId,
        location_id: locationId,
        assignment_type: assignmentType,
        start_date: new Date().toISOString(),
        created_at: team.created_at,
        updated_at: team.updated_at,
        permissions: {},
      };
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  async removeTeamFromLocation(assignmentId: string): Promise<void> {
    try {
      // Remove location assignment by setting location_id to null
      const { error } = await supabase
        .from('teams')
        .update({ location_id: null })
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team from location:', error);
      throw error;
    }
  }

  async getTeamsByLocation(locationId: string) {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          team_type,
          status,
          performance_score,
          created_at,
          updated_at
        `)
        .eq('location_id', locationId);

      if (error) throw error;
      return teams || [];
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      return [];
    }
  }
}

export const locationTeamService = new LocationTeamService();
