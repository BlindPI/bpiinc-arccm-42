
import { supabase } from '@/integrations/supabase/client';
import type { Provider } from '@/types/team-management';

export interface AuthorizedProvider extends Provider {
  // Additional provider-specific properties if needed
}

export class AuthorizedProviderService {
  async getProviderById(providerId: string): Promise<Provider | null> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .eq('id', parseInt(providerId, 10))
      .single();

    if (error) {
      console.error('Error fetching provider:', error);
      return null;
    }

    return {
      id: data.id.toString(), // Convert to string
      name: data.name,
      provider_type: data.provider_type || 'training_provider',
      status: data.status || 'active',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description
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
      id: provider.id.toString(), // Convert to string
      name: provider.name,
      provider_type: provider.provider_type || 'training_provider',
      status: provider.status || 'active',
      primary_location_id: provider.primary_location_id,
      performance_rating: provider.performance_rating || 0,
      compliance_score: provider.compliance_score || 0,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
      description: provider.description
    }));
  }

  async approveProvider(providerId: string, approverId: string): Promise<Provider> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .update({
        status: 'active',
        approved_by: approverId,
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', parseInt(providerId, 10))
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id.toString(), // Convert to string
      name: data.name,
      provider_type: data.provider_type || 'training_provider',
      status: data.status || 'active',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description
    };
  }

  async assignProviderToTeam(
    providerId: string, 
    teamId: string, 
    assignmentRole: string = 'provider',
    oversightLevel: string = 'monitor'
  ): Promise<string> {
    // This would typically use a provider_team_assignments table
    // For now, just update the team's provider_id
    const { error } = await supabase
      .from('teams')
      .update({ 
        provider_id: parseInt(providerId, 10), // Convert to number for database
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (error) throw error;

    return `${providerId}-${teamId}`;
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
