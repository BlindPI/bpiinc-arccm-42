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

// Helper function to safely parse JSONB arrays
function parseJsonArray(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Helper function to safely parse JSONB objects
function parseJsonObject(value: any): Record<string, any> {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

export class AuthorizedProviderService {
  async getAllProviders(): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .order('name');

      if (error) throw error;
      
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
        primary_location_id: provider.primary_location_id,
        provider_type: provider.provider_type || 'training_provider',
        certification_levels: parseJsonArray(provider.certification_levels),
        specializations: parseJsonArray(provider.specializations),
        contract_start_date: provider.contract_start_date,
        contract_end_date: provider.contract_end_date,
        performance_rating: provider.performance_rating || 0,
        compliance_score: provider.compliance_score || 0,
        created_at: provider.created_at || '',
        updated_at: provider.updated_at || '',
        primary_location: undefined,
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
        primary_location_id: data.primary_location_id,
        provider_type: data.provider_type || 'training_provider',
        certification_levels: parseJsonArray(data.certification_levels),
        specializations: parseJsonArray(data.specializations),
        contract_start_date: data.contract_start_date,
        contract_end_date: data.contract_end_date,
        performance_rating: data.performance_rating || 0,
        compliance_score: data.compliance_score || 0,
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
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated');
      }

      const { error } = await supabase.rpc('assign_provider_to_team', {
        p_provider_id: parseInt(assignment.provider_id),
        p_team_id: assignment.team_id,
        p_assignment_role: assignment.assignment_role,
        p_oversight_level: assignment.oversight_level,
        p_assigned_by: user.id
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  async getProviderTeamAssignments(providerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_provider_team_assignments', {
        p_provider_id: parseInt(providerId)
      });

      if (error) throw error;
      return data || [];
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
          provider_id: parseInt(providerId),
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
        .select('*')
        .eq('primary_location_id', locationId)
        .eq('status', 'APPROVED')
        .order('name');

      if (error) throw error;
      
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
        primary_location_id: provider.primary_location_id,
        provider_type: provider.provider_type || 'training_provider',
        certification_levels: parseJsonArray(provider.certification_levels),
        specializations: parseJsonArray(provider.specializations),
        contract_start_date: provider.contract_start_date,
        contract_end_date: provider.contract_end_date,
        performance_rating: provider.performance_rating || 0,
        compliance_score: provider.compliance_score || 0,
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
        .select(`
          *,
          primary_location:locations!primary_location_id(id, name, city, state)
        `)
        .eq('id', parseInt(providerId))
        .single();

      if (error || !provider) return null;

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
        primary_location_id: provider.primary_location_id,
        provider_type: provider.provider_type || 'training_provider',
        certification_levels: parseJsonArray(provider.certification_levels),
        specializations: parseJsonArray(provider.specializations),
        contract_start_date: provider.contract_start_date,
        contract_end_date: provider.contract_end_date,
        performance_rating: provider.performance_rating || 0,
        compliance_score: provider.compliance_score || 0,
        created_at: provider.created_at || '',
        updated_at: provider.updated_at || '',
        primary_location: provider.primary_location ? {
          id: provider.primary_location.id,
          name: provider.primary_location.name,
          city: provider.primary_location.city,
          state: provider.primary_location.state
        } : undefined,
        teams: []
      };
    } catch (error) {
      console.error('Error fetching provider with location:', error);
      return null;
    }
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
