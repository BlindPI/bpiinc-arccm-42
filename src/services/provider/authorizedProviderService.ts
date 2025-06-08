
import { supabase } from '@/integrations/supabase/client';
import type { Provider } from '@/types/team-management';

export interface AuthorizedProvider extends Provider {
  // Additional provider-specific properties if needed
}

export class AuthorizedProviderService {
  async getProviderById(providerId: number): Promise<Provider | null> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('id', providerId)
      .single();

    if (error) {
      console.error('Error fetching provider:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      provider_type: data.provider_type || 'training_provider',
      status: data.status || 'active',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async getAllProviders(): Promise<Provider[]> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching providers:', error);
      return [];
    }

    return data.map(provider => ({
      id: provider.id,
      name: provider.name,
      provider_type: provider.provider_type || 'training_provider',
      status: provider.status || 'active',
      primary_location_id: provider.primary_location_id,
      performance_rating: provider.performance_rating || 0,
      compliance_score: provider.compliance_score || 0,
      created_at: provider.created_at,
      updated_at: provider.updated_at
    }));
  }

  async approveProvider(providerId: number, approverId: string): Promise<Provider> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .update({
        status: 'active',
        approved_by: approverId,
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', providerId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      provider_type: data.provider_type || 'training_provider',
      status: data.status || 'active',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }

  async assignProviderToTeam(
    providerId: number, 
    teamId: string, 
    assignmentRole: string = 'provider',
    oversightLevel: string = 'monitor'
  ): Promise<string> {
    // This would typically use a provider_team_assignments table
    // For now, just update the team's provider_id
    const { error } = await supabase
      .from('teams')
      .update({ 
        provider_id: providerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (error) throw error;

    return `${providerId}-${teamId}`;
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
