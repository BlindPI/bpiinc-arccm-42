
import { supabase } from '@/integrations/supabase/client';

export interface AuthorizedProvider {
  id: string;
  name: string;
  provider_type: string;
  status: string;
  performance_rating?: number;
  compliance_score?: number;
  created_at: string;
  updated_at: string;
  description?: string;
}

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
