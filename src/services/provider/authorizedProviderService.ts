
import { supabase } from '@/integrations/supabase/client';
import type { AuthorizedProvider } from '@/types/supabase-schema';

export class AuthorizedProviderService {
  static async getProviders(): Promise<AuthorizedProvider[]> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  static async getProviderById(id: string): Promise<AuthorizedProvider | null> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Legacy method name for compatibility
  static async getAllProviders(): Promise<AuthorizedProvider[]> {
    return this.getProviders();
  }

  static async createProvider(providerData: Omit<AuthorizedProvider, 'id' | 'created_at' | 'updated_at'>): Promise<AuthorizedProvider> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .insert(providerData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateProvider(id: string, updates: Partial<AuthorizedProvider>): Promise<AuthorizedProvider> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteProvider(id: string): Promise<void> {
    const { error } = await supabase
      .from('authorized_providers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Export both the class and instance for compatibility
export const authorizedProviderService = AuthorizedProviderService;

// Re-export the type for convenience
export type { AuthorizedProvider } from '@/types/supabase-schema';
