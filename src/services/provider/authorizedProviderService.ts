
import { supabase } from '@/integrations/supabase/client';

export interface AuthorizedProvider {
  id: string;
  name: string;
  provider_name: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  description?: string;
  provider_type: string;
  provider_url: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  primary_location_id?: string;
  performance_rating: number;
  compliance_score: number;
  certification_levels?: any[];
  specializations?: any[];
  contract_start_date?: string;
  contract_end_date?: string;
  approval_date?: string;
  approved_by?: string;
  user_id?: string;
  metadata?: any;
  provider_team_id?: string;
  created_at: string;
  updated_at: string;
}

export class AuthorizedProviderService {
  static async getAllProviders(): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(provider => ({
        id: provider.id?.toString() || '',
        name: provider.name || provider.provider_name || 'Unknown Provider',
        provider_name: provider.provider_name || provider.name || 'Unknown Provider',
        status: provider.status || 'pending',
        description: provider.description,
        provider_type: provider.provider_type || 'training_provider',
        provider_url: provider.provider_url || '',
        contact_email: provider.contact_email,
        contact_phone: provider.contact_phone,
        address: provider.address,
        website: provider.website,
        primary_location_id: provider.primary_location_id,
        performance_rating: provider.performance_rating || 0,
        compliance_score: provider.compliance_score || 0,
        certification_levels: provider.certification_levels || [],
        specializations: provider.specializations || [],
        contract_start_date: provider.contract_start_date,
        contract_end_date: provider.contract_end_date,
        approval_date: provider.approval_date,
        approved_by: provider.approved_by,
        user_id: provider.user_id,
        metadata: provider.metadata || {},
        provider_team_id: provider.provider_team_id,
        created_at: provider.created_at,
        updated_at: provider.updated_at
      }));
    } catch (error) {
      console.error('Error fetching authorized providers:', error);
      return [];
    }
  }

  static async createProvider(providerData: Partial<AuthorizedProvider>): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .insert({
          name: providerData.name,
          provider_name: providerData.provider_name || providerData.name,
          status: providerData.status || 'pending',
          description: providerData.description,
          provider_type: providerData.provider_type || 'training_provider',
          provider_url: providerData.provider_url || '',
          contact_email: providerData.contact_email,
          contact_phone: providerData.contact_phone,
          address: providerData.address,
          website: providerData.website,
          primary_location_id: providerData.primary_location_id,
          performance_rating: providerData.performance_rating || 0,
          compliance_score: providerData.compliance_score || 0,
          certification_levels: providerData.certification_levels || [],
          specializations: providerData.specializations || [],
          contract_start_date: providerData.contract_start_date,
          contract_end_date: providerData.contract_end_date,
          user_id: providerData.user_id,
          metadata: providerData.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapProviderData(data);
    } catch (error) {
      console.error('Error creating provider:', error);
      return null;
    }
  }

  static async updateProvider(id: string, updates: Partial<AuthorizedProvider>): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .update({
          name: updates.name,
          provider_name: updates.provider_name,
          status: updates.status,
          description: updates.description,
          provider_type: updates.provider_type,
          contact_email: updates.contact_email,
          contact_phone: updates.contact_phone,
          address: updates.address,
          website: updates.website,
          primary_location_id: updates.primary_location_id,
          performance_rating: updates.performance_rating,
          compliance_score: updates.compliance_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapProviderData(data);
    } catch (error) {
      console.error('Error updating provider:', error);
      return null;
    }
  }

  private static mapProviderData(data: any): AuthorizedProvider {
    return {
      id: data.id?.toString() || '',
      name: data.name || data.provider_name || 'Unknown Provider',
      provider_name: data.provider_name || data.name || 'Unknown Provider',
      status: data.status || 'pending',
      description: data.description,
      provider_type: data.provider_type || 'training_provider',
      provider_url: data.provider_url || '',
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      address: data.address,
      website: data.website,
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      certification_levels: data.certification_levels || [],
      specializations: data.specializations || [],
      contract_start_date: data.contract_start_date,
      contract_end_date: data.contract_end_date,
      approval_date: data.approval_date,
      approved_by: data.approved_by,
      user_id: data.user_id,
      metadata: data.metadata || {},
      provider_team_id: data.provider_team_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
}

export const authorizedProviderService = AuthorizedProviderService;
