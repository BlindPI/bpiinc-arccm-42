
import { supabase } from '@/integrations/supabase/client';

export interface AuthorizedProvider {
  id: number;
  name: string;
  provider_name: string;
  provider_url: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  provider_type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
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
      return data || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  static async getProviderById(providerId: string): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching provider by ID:', error);
      return null;
    }
  }

  static async createProvider(provider: Partial<AuthorizedProvider>): Promise<AuthorizedProvider | null> {
    try {
      const { data, error } = await supabase
        .from('authorized_providers')
        .insert(provider)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      return data;
    } catch (error) {
      console.error('Error updating provider:', error);
      return null;
    }
  }

  static async deleteProvider(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting provider:', error);
      throw error;
    }
  }
}
