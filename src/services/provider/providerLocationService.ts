import { supabase } from '@/integrations/supabase/client';

export interface ProviderLocationKPIs {
  totalInstructors: number;
  activeInstructors: number;
  totalCourses: number;
  certificatesIssued: number;
  complianceScore: number;
  performanceRating: number;
}

export interface ProviderLocationTeam {
  teamId: string;
  teamName: string;
  teamDescription: string;
  locationName: string;
  memberCount: number;
  performanceScore: number;
}

export class ProviderLocationService {
  static async getProviderLocationKPIs(providerId: string): Promise<ProviderLocationKPIs> {
    try {
      // Pass UUID directly since the RPC function expects a UUID
      const { data, error } = await supabase.rpc('get_provider_location_kpis', {
        p_provider_id: providerId
      });

      if (error) throw error;

      // Handle the case where data might be empty or null
      const result = data && data.length > 0 ? data[0] : {};
      
      return {
        totalInstructors: Number(result['total_instructors']) || 0,
        activeInstructors: Number(result['active_instructors']) || 0,
        totalCourses: Number(result['total_courses']) || 0,
        certificatesIssued: Number(result['certificates_issued']) || 0,
        complianceScore: Number(result['compliance_score']) || 0,
        performanceRating: Number(result['performance_rating']) || 0
      };
    } catch (error) {
      console.error('Error fetching provider location KPIs:', error);
      throw error;
    }
  }

  static async getProviderLocationTeams(providerId: string): Promise<ProviderLocationTeam[]> {
    try {
      // Pass UUID directly since the RPC function expects a UUID
      const { data, error } = await supabase.rpc('get_provider_location_teams', {
        p_provider_id: providerId
      });

      if (error) throw error;

      return (data || []).map((team: any) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        teamDescription: team.team_description || '',
        locationName: team.location_name || '',
        memberCount: Number(team.member_count) || 0,
        performanceScore: Number(team.performance_score) || 0
      }));
    } catch (error) {
      console.error('Error fetching provider location teams:', error);
      throw error;
    }
  }

  static async assignProviderToLocation(
    providerId: string,
    locationId: string
  ): Promise<void> {
    try {
      // Use UUID directly since authorized_providers.id is a UUID
      const { error } = await supabase
        .from('authorized_providers')
        .update({ primary_location_id: locationId })
        .eq('id', providerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning provider to location:', error);
      throw error;
    }
  }

  static async getProviderByLocation(locationId: string) {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations!primary_location_id(*)
        `)
        .eq('primary_location_id', locationId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching provider by location:', error);
      return null;
    }
  }
}
