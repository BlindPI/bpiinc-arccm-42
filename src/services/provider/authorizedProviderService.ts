
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
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Transform the data to match our interface with safe property access
      return (data || []).map(provider => ({
        id: provider.id?.toString() || '',
        name: provider.name || '',
        provider_name: provider.provider_name || '',
        provider_url: provider.provider_url || '',
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone,
        address: provider.address,
        description: provider.description,
        status: provider.status,
        primary_location_id: (provider as any).primary_location_id,
        provider_type: (provider as any).provider_type || 'training_provider',
        certification_levels: (provider as any).certification_levels || [],
        specializations: (provider as any).specializations || [],
        contract_start_date: (provider as any).contract_start_date,
        contract_end_date: (provider as any).contract_end_date,
        performance_rating: (provider as any).performance_rating || 0,
        compliance_score: (provider as any).compliance_score || 0,
        created_at: provider.created_at || '',
        updated_at: provider.updated_at || '',
        primary_location: undefined, // Will be populated separately if needed
        teams: []
      }));
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
          status: 'PENDING'
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        id: data.id?.toString() || '',
        name: data.name || '',
        provider_name: data.provider_name || '',
        provider_url: data.provider_url || '',
        contact_email: data.contact_email,
        contact_phone: data.contact_phone,
        address: data.address,
        description: data.description,
        status: data.status,
        primary_location_id: (data as any).primary_location_id,
        provider_type: (data as any).provider_type || 'training_provider',
        certification_levels: (data as any).certification_levels || [],
        specializations: (data as any).specializations || [],
        contract_start_date: (data as any).contract_start_date,
        contract_end_date: (data as any).contract_end_date,
        performance_rating: (data as any).performance_rating || 0,
        compliance_score: (data as any).compliance_score || 0,
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        primary_location: undefined,
        teams: []
      };
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
        .eq('id', parseInt(providerId));

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
      // For now, just log the assignment since the table doesn't exist yet
      console.log('Provider assignment:', assignment);
      
      // In the future, this would insert into provider_team_assignments table
      // when the Supabase types are updated
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  async getProviderTeamAssignments(providerId: string): Promise<ProviderTeamAssignment[]> {
    try {
      // Since the new tables aren't in types yet, return empty array for now
      console.log('Getting team assignments for provider:', providerId);
      return [];
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
      // Since the new table isn't in types yet, just log for now
      console.log('Updating provider performance:', providerId, performance);
    } catch (error) {
      console.error('Error updating provider performance:', error);
      throw error;
    }
  }

  async getProvidersByLocation(locationId: string): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('status', 'APPROVED')
        .order('name');

      if (error) throw error;
      
      // Filter by location in application code for now
      const filtered = (data || []).filter(provider => 
        (provider as any).primary_location_id === locationId
      );
      
      return filtered.map(provider => ({
        id: provider.id?.toString() || '',
        name: provider.name || '',
        provider_name: provider.provider_name || '',
        provider_url: provider.provider_url || '',
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone,
        address: provider.address,
        description: provider.description,
        status: provider.status,
        primary_location_id: (provider as any).primary_location_id,
        provider_type: (provider as any).provider_type || 'training_provider',
        certification_levels: (provider as any).certification_levels || [],
        specializations: (provider as any).specializations || [],
        contract_start_date: (provider as any).contract_start_date,
        contract_end_date: (provider as any).contract_end_date,
        performance_rating: (provider as any).performance_rating || 0,
        compliance_score: (provider as any).compliance_score || 0,
        created_at: provider.created_at || '',
        updated_at: provider.updated_at || '',
        primary_location: undefined,
        teams: []
      }));
    } catch (error) {
      console.error('Error fetching providers by location:', error);
      throw error;
    }
  }

  async getProviderWithLocation(providerId: string): Promise<AuthorizedProvider | null> {
    try {
      const { data: provider, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error || !provider) return null;

      // Get location separately if primary_location_id exists
      let location = undefined;
      const primaryLocationId = (provider as any).primary_location_id;
      
      if (primaryLocationId) {
        const { data: locationData } = await supabase
          .from('locations')
          .select('id, name, city, state')
          .eq('id', primaryLocationId)
          .single();
        
        if (locationData) {
          location = {
            id: locationData.id,
            name: locationData.name,
            city: locationData.city,
            state: locationData.state
          };
        }
      }

      return {
        id: provider.id?.toString() || '',
        name: provider.name || '',
        provider_name: provider.provider_name || '',
        provider_url: provider.provider_url || '',
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone,
        address: provider.address,
        description: provider.description,
        status: provider.status,
        primary_location_id: primaryLocationId,
        provider_type: (provider as any).provider_type || 'training_provider',
        certification_levels: (provider as any).certification_levels || [],
        specializations: (provider as any).specializations || [],
        contract_start_date: (provider as any).contract_start_date,
        contract_end_date: (provider as any).contract_end_date,
        performance_rating: (provider as any).performance_rating || 0,
        compliance_score: (provider as any).compliance_score || 0,
        created_at: provider.created_at || '',
        updated_at: provider.updated_at || '',
        primary_location: location,
        teams: []
      };
    } catch (error) {
      console.error('Error fetching provider with location:', error);
      return null;
    }
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
