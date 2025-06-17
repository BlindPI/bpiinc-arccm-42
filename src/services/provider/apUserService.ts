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

export interface APUserLocationAssignment {
  assignment_id: string;
  ap_user_id: string;
  ap_user_name: string;
  ap_user_email: string;
  location_id: string;
  location_name: string;
  location_city?: string;
  location_state?: string;
  assignment_role: string;
  status: string;
  start_date: string;
  end_date?: string;
  team_count: number;
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
   * Get available AP users for a specific location (not yet assigned)
   */
  async getAvailableAPUsersForLocation(locationId: string): Promise<APUser[]> {
    try {
      // Try using the database function first
      const { data, error } = await supabase
        .rpc('get_available_ap_users_for_location', { p_location_id: locationId });

      if (error) throw error;

      return data?.map((user: any) => ({
        id: user.user_id,
        display_name: user.display_name,
        email: user.email,
        role: 'AP',
        created_at: user.created_at,
        updated_at: user.created_at,
        status: 'ACTIVE',
        phone: user.phone,
        organization: user.organization,
        job_title: user.job_title
      })) || [];
    } catch (error: any) {
      // Fallback: Direct table query
      console.warn('Database function not available, using fallback method:', error.message);
      
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, created_at, updated_at, status, phone, organization, job_title')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .not('id', 'in', `(
          SELECT ap_user_id
          FROM ap_user_location_assignments
          WHERE location_id = '${locationId}'
          AND status = 'active'
        )`)
        .order('display_name');

      if (queryError) {
        console.error('Error fetching available AP users:', queryError);
        return [];
      }

      return data || [];
    }
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
   * Assign AP user to a location (supports multiple locations per AP user)
   */
  async assignAPUserToLocation(
    apUserId: string,
    locationId: string,
    assignmentRole: string = 'provider',
    endDate?: string
  ): Promise<string> {
    try {
      // Try using the database function first
      const { data, error } = await supabase
        .rpc('assign_ap_user_to_location', {
          p_ap_user_id: apUserId,
          p_location_id: locationId,
          p_assignment_role: assignmentRole,
          p_end_date: endDate || null
        });

      if (error) throw error;
      return data;
    } catch (error: any) {
      // Fallback: Direct table operations if function doesn't exist
      console.warn('Database function not available, using fallback method:', error.message);
      
      // First, verify the AP user exists and has correct role
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization, role, status')
        .eq('id', apUserId)
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .single();

      if (userError || !apUser) {
        throw new Error('AP user not found or not active');
      }

      // Create the assignment record
      const { data: assignment, error: assignmentError } = await supabase
        .from('ap_user_location_assignments' as any)
        .insert({
          ap_user_id: apUserId,
          location_id: locationId,
          assignment_role: assignmentRole,
          end_date: endDate || null,
          status: 'active'
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // Create the corresponding authorized_provider record
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .insert({
          user_id: apUserId,
          name: apUser.display_name,
          provider_name: apUser.display_name,
          provider_url: apUser.organization || '',
          provider_type: 'authorized_provider',
          location_id: locationId,
          assignment_type: 'location_based',
          status: 'APPROVED',
          performance_rating: 0,
          compliance_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (providerError) {
        // If provider creation fails, clean up the assignment
        await supabase
          .from('ap_user_location_assignments' as any)
          .delete()
          .eq('id', assignment.id);
        throw providerError;
      }

      return assignment.id;
    }
  }

  /**
   * Get all AP user location assignments
   */
  async getAPUserAssignments(apUserId?: string): Promise<APUserLocationAssignment[]> {
    const { data, error } = await supabase
      .rpc('get_ap_user_assignments', { p_ap_user_id: apUserId || null });

    if (error) {
      console.error('Error fetching AP user assignments:', error);
      return [];
    }

    return data?.map((assignment: any) => ({
      assignment_id: assignment.assignment_id,
      ap_user_id: assignment.ap_user_id,
      ap_user_name: assignment.ap_user_name,
      ap_user_email: assignment.ap_user_email,
      location_id: assignment.location_id,
      location_name: assignment.location_name,
      location_city: assignment.location_city,
      location_state: assignment.location_state,
      assignment_role: assignment.assignment_role,
      status: assignment.status,
      start_date: assignment.start_date,
      end_date: assignment.end_date,
      team_count: assignment.team_count
    })) || [];
  }

  /**
   * Remove AP user assignment from a location
   */
  async removeAPUserFromLocation(apUserId: string, locationId: string): Promise<void> {
    const { error } = await supabase
      .from('ap_user_location_assignments' as any)
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('ap_user_id', apUserId)
      .eq('location_id', locationId);

    if (error) {
      console.error('Error removing AP user from location:', error);
      throw error;
    }

    // Also update the corresponding authorized_provider record
    await supabase
      .from('authorized_providers')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('user_id', apUserId)
      .eq('location_id', locationId);
  }

  /**
   * Get authorized providers (for backward compatibility)
   * This now returns AP users who have been assigned as providers
   */
  async getAuthorizedProviders(): Promise<any[]> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select(`
        id,
        name,
        provider_type,
        status,
        location_id,
        performance_rating,
        compliance_score,
        created_at,
        updated_at,
        user_id,
        locations:location_id (
          id,
          name,
          city,
          state
        ),
        profiles:user_id (
          id,
          display_name,
          email,
          organization,
          job_title
        )
      `)
      .eq('status', 'APPROVED')
      .order('name');

    if (error) {
      console.error('Error fetching authorized providers:', error);
      return [];
    }

    return data || [];
  }

  // Legacy method for backward compatibility
  async assignAPUserAsProvider(
    apUserId: string,
    locationId: string,
    assignedBy: string
  ): Promise<string> {
    return this.assignAPUserToLocation(apUserId, locationId, 'provider');
  }
}

export const apUserService = new APUserService();