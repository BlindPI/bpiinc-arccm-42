
import { supabase } from '@/integrations/supabase/client';

interface AuthorizedProvider {
  id: number;
  name: string;
  provider_type: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
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

  static async updateProvider(id: number, updates: Partial<AuthorizedProvider>): Promise<AuthorizedProvider | null> {
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

  static async approveProvider(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .update({ 
          status: 'active',
          approval_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving provider:', error);
      return false;
    }
  }

  static async deleteProvider(id: number): Promise<boolean> {
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
