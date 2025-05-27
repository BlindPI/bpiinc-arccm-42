
import { supabase } from '@/integrations/supabase/client';

export interface AuthorizedProvider {
  id: string;
  name: string;
  provider_name: string;
  provider_url: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  description?: string;
  status?: string;
  primary_location_id?: string;
  provider_type: string;
  certification_levels: string[];
  specializations: any[];
  contract_start_date?: string;
  contract_end_date?: string;
  performance_rating: number;
  compliance_score: number;
  created_at: string;
  updated_at: string;
  primary_location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
  teams?: any[];
}

export interface ProviderRegistrationData {
  name: string;
  provider_name: string;
  provider_url: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  description?: string;
  primary_location_id?: string;
  provider_type: string;
  certification_levels: string[];
  specializations: any[];
  contract_start_date?: string;
  contract_end_date?: string;
}

export interface ProviderTeamAssignment {
  id: string;
  provider_id: string;
  team_id: string;
  assignment_role: string;
  oversight_level: 'none' | 'monitor' | 'manage' | 'admin';
  assigned_by: string;
  assigned_at: string;
  status: 'active' | 'inactive' | 'suspended';
  team_name?: string;
  team_location?: string;
}

export class AuthorizedProviderService {
  async getAllProviders(): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations(id, name, city, state),
          provider_team_assignments(
            *,
            team:teams(id, name, location:locations(name))
          )
        `)
        .order('name');

      if (error) throw error;
      return data as AuthorizedProvider[];
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  async createProvider(providerData: ProviderRegistrationData): Promise<AuthorizedProvider> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .insert({
          ...providerData,
          status: 'PENDING',
          performance_rating: 0.00,
          compliance_score: 0.00
        })
        .select(`
          *,
          primary_location:locations(id, name, city, state)
        `)
        .single();

      if (error) throw error;
      return data as AuthorizedProvider;
    } catch (error) {
      console.error('Error creating provider:', error);
      throw error;
    }
  }

  async approveProvider(providerId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .update({
          status: 'APPROVED',
          approved_by: approvedBy,
          approval_date: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving provider:', error);
      throw error;
    }
  }

  async assignProviderToTeam(assignment: {
    provider_id: string;
    team_id: string;
    assignment_role: string;
    oversight_level: 'none' | 'monitor' | 'manage' | 'admin';
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_team_assignments')
        .insert({
          ...assignment,
          assigned_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'active'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  async getProviderTeamAssignments(providerId: string): Promise<ProviderTeamAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('provider_team_assignments')
        .select(`
          *,
          team:teams(
            name,
            location:locations(name)
          )
        `)
        .eq('provider_id', providerId)
        .eq('status', 'active');

      if (error) throw error;
      
      return data.map(item => ({
        ...item,
        team_name: item.team?.name || 'Unknown Team',
        team_location: item.team?.location?.name || 'No Location'
      })) as ProviderTeamAssignment[];
    } catch (error) {
      console.error('Error fetching provider team assignments:', error);
      throw error;
    }
  }

  async updateProviderPerformance(providerId: string, performance: {
    team_id?: string;
    location_id?: string;
    performance_period: string;
    certificates_issued?: number;
    courses_conducted?: number;
    student_satisfaction_score?: number;
    compliance_score?: number;
    revenue_generated?: number;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('provider_performance')
        .insert({
          provider_id: providerId,
          ...performance,
          recorded_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating provider performance:', error);
      throw error;
    }
  }

  async getProvidersByLocation(locationId: string): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select(`
          *,
          primary_location:locations(id, name, city, state)
        `)
        .eq('primary_location_id', locationId)
        .eq('status', 'APPROVED')
        .order('name');

      if (error) throw error;
      return data as AuthorizedProvider[];
    } catch (error) {
      console.error('Error fetching providers by location:', error);
      throw error;
    }
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
