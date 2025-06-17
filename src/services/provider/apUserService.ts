import { supabase } from '@/integrations/supabase/client';

export interface APUser {
  id: string;
  display_name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  status?: string;
  phone?: string;
  organization?: string;
  job_title?: string;
}

export class APUserService {
  /**
   * Get all users with AP (Authorized Provider) role
   */
  async getAPUsers(): Promise<APUser[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, created_at, updated_at, status, phone, organization, job_title')
      .eq('role', 'AP')
      .eq('status', 'ACTIVE')
      .order('display_name');

    if (error) {
      console.error('Error fetching AP users:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get AP user by ID
   */
  async getAPUserById(userId: string): Promise<APUser | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role, created_at, updated_at, status, phone, organization, job_title')
      .eq('id', userId)
      .eq('role', 'AP')
      .single();

    if (error) {
      console.error('Error fetching AP user:', error);
      return null;
    }

    return data;
  }

  /**
   * Check if user has AP role
   */
  async isAPUser(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .eq('role', 'AP')
      .single();

    return !error && data !== null;
  }

  /**
   * Assign AP user as authorized provider for a location/team
   */
  async assignAPUserAsProvider(
    apUserId: string, 
    locationId: string, 
    assignedBy: string
  ): Promise<string> {
    // Create or update the authorized_providers record to link AP user
    const { data, error } = await supabase
      .from('authorized_providers')
      .upsert({
        user_id: apUserId, // Link to the AP user
        name: '', // Will be populated from profile
        provider_name: '', // Will be populated from profile
        provider_url: '',
        provider_type: 'authorized_provider',
        primary_location_id: locationId,
        status: 'APPROVED', // AP users are pre-approved
        performance_rating: 0,
        compliance_score: 0,
        approved_by: assignedBy,
        approval_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    // Update the record with profile information
    const apUser = await this.getAPUserById(apUserId);
    if (apUser) {
      await supabase
        .from('authorized_providers')
        .update({
          name: apUser.display_name,
          provider_name: apUser.display_name,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.id);
    }

    return data.id;
  }
}

export const apUserService = new APUserService();