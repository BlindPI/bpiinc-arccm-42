
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
}

// Export both the class and instance for compatibility
export const authorizedProviderService = AuthorizedProviderService;
