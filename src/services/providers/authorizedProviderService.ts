
import { supabase } from '@/integrations/supabase/client';

export interface AuthorizedProvider {
  id: string | number;
  name: string;
  provider_name?: string;
  provider_type: string;
  status: 'APPROVED' | 'REJECTED' | 'PENDING' | 'SUSPENDED';
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  compliance_score: number;
  performance_rating: number;
  contract_start_date?: string;
  contract_end_date?: string;
  specializations?: string[];
  certification_levels?: string[];
  primary_location_id?: string;
  metadata?: Record<string, any>;
  approved_by?: string;
  approval_date?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export class AuthorizedProviderService {
  static async getProviders(): Promise<AuthorizedProvider[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(provider => ({
        ...provider,
        id: provider.id.toString(),
        compliance_score: provider.compliance_score || 0,
        performance_rating: provider.performance_rating || 0
      }));
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  static async getProviderById(id: string): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return {
        ...data,
        id: data.id.toString(),
        compliance_score: data.compliance_score || 0,
        performance_rating: data.performance_rating || 0
      };
    } catch (error) {
      console.error('Error fetching provider:', error);
      return null;
    }
  }

  static async createProvider(providerData: Omit<AuthorizedProvider, 'id' | 'created_at' | 'updated_at'>): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .insert({
          ...providerData,
          compliance_score: providerData.compliance_score || 0,
          performance_rating: providerData.performance_rating || 0
        })
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        id: data.id.toString()
      };
    } catch (error) {
      console.error('Error creating provider:', error);
      return null;
    }
  }

  static async updateProvider(id: string, updates: Partial<AuthorizedProvider>): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        id: data.id.toString()
      };
    } catch (error) {
      console.error('Error updating provider:', error);
      return null;
    }
  }

  static async approveProvider(providerId: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .update({ 
          status: 'APPROVED',
          approved_by: approvedBy,
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', providerId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving provider:', error);
      return false;
    }
  }

  static async deleteProvider(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting provider:', error);
      return false;
    }
  }
}

export const authorizedProviderService = AuthorizedProviderService;
export type { AuthorizedProvider };
