
import { supabase } from '@/integrations/supabase/client';
import type { AuthorizedProvider } from '@/types/provider-management';
import { isValidUUID, validateUUID, getUUIDErrorMessage } from '@/utils/uuidValidation';

export class AuthorizedProviderService {
  async getProviderById(providerId: string): Promise<AuthorizedProvider | null> {
    // Validate UUID format
    if (!isValidUUID(providerId)) {
      console.error(getUUIDErrorMessage(providerId, 'getProviderById'));
      return null;
    }

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
      status: data.status || 'PENDING',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description,
      website: data.website,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      address: data.address,
      approved_by: data.approved_by,
      approval_date: data.approval_date
    };
  }

  async getAllProviders(): Promise<AuthorizedProvider[]> {
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
      status: provider.status || 'PENDING',
      primary_location_id: provider.primary_location_id,
      performance_rating: provider.performance_rating || 0,
      compliance_score: provider.compliance_score || 0,
      created_at: provider.created_at,
      updated_at: provider.updated_at,
      description: provider.description,
      website: provider.website,
      contact_email: provider.contact_email,
      contact_phone: provider.contact_phone,
      address: provider.address,
      approved_by: provider.approved_by,
      approval_date: provider.approval_date
    }));
  }

  async approveProvider(providerId: string, approverId: string): Promise<AuthorizedProvider> {
    // Validate UUID formats
    validateUUID(providerId, 'Provider ID');
    validateUUID(approverId, 'Approver ID');

    const { data, error } = await supabase
      .from('authorized_providers')
      .update({
        status: 'APPROVED',
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
      status: data.status || 'APPROVED',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description,
      website: data.website,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      address: data.address,
      approved_by: data.approved_by,
      approval_date: data.approval_date
    };
  }

  async assignProviderToTeam(
    providerId: string,
    teamId: string,
    assignmentRole: string = 'provider',
    oversightLevel: string = 'monitor'
  ): Promise<string> {
    // Validate UUID formats
    validateUUID(providerId, 'Provider ID');
    validateUUID(teamId, 'Team ID');

    // This would typically use a provider_team_assignments table
    // For now, just update the team's provider_id
    const { error } = await supabase
      .from('teams')
      .update({
        provider_id: providerId, // UUID string
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId);

    if (error) throw error;

    return `${providerId}-${teamId}`;
  }

  async rejectProvider(providerId: string, rejectedBy: string, reason?: string): Promise<AuthorizedProvider> {
    // Validate UUID formats
    validateUUID(providerId, 'Provider ID');
    validateUUID(rejectedBy, 'Rejected By ID');

    const { data, error } = await supabase
      .from('authorized_providers')
      .update({
        status: 'REJECTED',
        rejected_by: rejectedBy,
        rejection_date: new Date().toISOString(),
        rejection_reason: reason,
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
      status: data.status || 'REJECTED',
      primary_location_id: data.primary_location_id,
      performance_rating: data.performance_rating || 0,
      compliance_score: data.compliance_score || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      description: data.description,
      website: data.website,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      address: data.address,
      approved_by: data.approved_by,
      approval_date: data.approval_date
    };
  }
}

export const authorizedProviderService = new AuthorizedProviderService();
