
import { supabase } from '@/integrations/supabase/client';

export interface LocationTeamAssignment {
  id: string;
  team_id: string;
  location_id: string;
  assignment_type: string;
  permissions: Record<string, any>;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationTeamMetrics {
  location_id: string;
  location_name: string;
  total_teams: number;
  active_assignments: number;
  team_performance_avg: number;
}

export class LocationTeamService {
  async getLocationTeamAssignments(locationId: string): Promise<LocationTeamAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select('*')
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching location team assignments:', error);
      return [];
    }
  }

  async assignTeamToLocation(
    teamId: string,
    locationId: string,
    assignmentType: 'primary' | 'secondary' | 'temporary' = 'primary',
    permissions: Record<string, any> = {},
    endDate?: Date
  ): Promise<LocationTeamAssignment> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          permissions,
          end_date: endDate?.toISOString(),
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

  async updateTeamAssignment(
    assignmentId: string,
    updates: Partial<LocationTeamAssignment>
  ): Promise<LocationTeamAssignment> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', assignmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating team assignment:', error);
      throw error;
    }
  }

  async removeTeamAssignment(assignmentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_location_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing team assignment:', error);
      throw error;
    }
  }

  async getLocationTeamMetrics(): Promise<LocationTeamMetrics[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select(`
          id,
          name,
          team_location_assignments(
            id,
            assignment_type,
            start_date,
            end_date,
            team_id,
            created_at
          )
        `);

      if (error) throw error;

      const metrics: LocationTeamMetrics[] = (data || []).map(location => {
        const assignments = location.team_location_assignments || [];
        const activeAssignments = assignments.filter(a => 
          !a.end_date || new Date(a.end_date) > new Date()
        );

        return {
          location_id: location.id,
          location_name: location.name,
          total_teams: new Set(assignments.map(a => a.team_id)).size,
          active_assignments: activeAssignments.length,
          team_performance_avg: Math.random() * 100, // Placeholder
        };
      });

      return metrics;
    } catch (error) {
      console.error('Error fetching location team metrics:', error);
      return [];
    }
  }

  async getTeamsByLocation(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          teams(
            id,
            name,
            description,
            status,
            performance_score
          )
        `)
        .eq('location_id', locationId)
        .not('end_date', 'lt', new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      return [];
    }
  }

  async getLocationsByTeam(teamId: string) {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          locations(
            id,
            name,
            address,
            city,
            province
          )
        `)
        .eq('team_id', teamId)
        .not('end_date', 'lt', new Date().toISOString());

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching locations by team:', error);
      return [];
    }
  }
}

export const locationTeamService = new LocationTeamService();
