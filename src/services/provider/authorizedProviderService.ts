
import { supabase } from '@/integrations/supabase/client';

interface AuthorizedProvider {
  id: string;
  name: string;
  provider_type: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  primary_location_id?: string;
  performance_rating: number;
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
      return data || [];
    } catch (error) {
      console.error('Error fetching providers:', error);
      return [];
    }
  }

  static async getProviders(): Promise<AuthorizedProvider[]> {
    return this.getAllProviders();
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

  static async approveProvider(providerId: string, approvedBy: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_providers')
        .update({ 
          status: 'APPROVED',
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

  static async assignProviderToTeam(
    providerId: string,
    teamId: string,
    assignmentRole: string,
    oversightLevel: string
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('provider_team_assignments')
        .insert({
          provider_id: providerId,
          team_id: teamId,
          assignment_role: assignmentRole,
          oversight_level: oversightLevel,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
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

// Export both the class and an instance for compatibility
export const authorizedProviderService = AuthorizedProviderService;
export type { AuthorizedProvider };
