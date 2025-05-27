
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
      const { data, error } = await supabase.rpc('get_provider_location_kpis', {
        p_provider_id: parseInt(providerId)
      });

      if (error) throw error;

      const result = data?.[0] || {};
      return {
        totalInstructors: result.total_instructors || 0,
        activeInstructors: result.active_instructors || 0,
        totalCourses: result.total_courses || 0,
        certificatesIssued: result.certificates_issued || 0,
        complianceScore: result.compliance_score || 0,
        performanceRating: result.performance_rating || 0
      };
    } catch (error) {
      console.error('Error fetching provider location KPIs:', error);
      throw error;
    }
  }

  static async getProviderLocationTeams(providerId: string): Promise<ProviderLocationTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_provider_location_teams', {
        p_provider_id: parseInt(providerId)
      });

      if (error) throw error;

      return (data || []).map((team: any) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        teamDescription: team.team_description,
        locationName: team.location_name,
        memberCount: team.member_count,
        performanceScore: team.performance_score
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
      const { error } = await supabase
        .from('authorized_providers')
        .update({ primary_location_id: locationId })
        .eq('id', parseInt(providerId));

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
