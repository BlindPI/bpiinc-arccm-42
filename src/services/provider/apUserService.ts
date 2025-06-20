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
      // Use the database function
      const { data, error } = await supabase
        .rpc('get_available_ap_users_for_location', { p_location_id: locationId });

      if (!error && data) {
        return data.map((user: any) => ({
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
        }));
      }
      
      if (error) {
        console.error('RPC function error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Database function failed:', error);
    }

    // Fallback: Get all AP users and filter out assigned ones
    try {
      const allAPUsers = await this.getAPUsers();
      const assignments = await this.getAPUserAssignments();
      const assignedUserIds = assignments
        .filter(a => a.location_id === locationId && a.status === 'active')
        .map(a => a.ap_user_id);

      return allAPUsers.filter(user => !assignedUserIds.includes(user.id));
    } catch (fallbackError: any) {
      console.error('Fallback method also failed:', fallbackError);
      return [];
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
      // Use the database function
      const { data, error } = await supabase
        .rpc('assign_ap_user_to_location', {
          p_ap_user_id: apUserId,
          p_location_id: locationId,
          p_assignment_role: assignmentRole,
          p_end_date: endDate || null
        });

      if (!error && data) {
        return data;
      }
      
      if (error) {
        console.error('RPC assignment function error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Database function failed, using fallback:', error);
    }

    // Fallback: Direct table operations
    try {
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

      // Create the authorized_provider record directly
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
        throw providerError;
      }

      // Update profile location if not set
      if (!apUser.location_id || apUser.location_id !== locationId) {
        await supabase
          .from('profiles')
          .update({
            location_id: locationId,
            updated_at: new Date().toISOString()
          })
          .eq('id', apUserId);
      }

      return provider.id;
    } catch (fallbackError: any) {
      console.error('All assignment methods failed:', fallbackError);
      throw fallbackError;
    }
  }

  /**
   * Get all AP user location assignments (with fallback)
   */
  async getAPUserAssignments(apUserId?: string): Promise<APUserLocationAssignment[]> {
    try {
      // Use the RPC function
      const { data, error } = await supabase
        .rpc('get_ap_user_assignments', { p_ap_user_id: apUserId || null });

      if (!error && data) {
        return data.map((assignment: any) => ({
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
        }));
      }
      
      if (error) {
        console.error('RPC assignments function error:', error);
      }
    } catch (rpcError) {
      console.error('RPC function failed, using fallback method:', rpcError);
    }

    // Fallback: Use authorized_providers table
    try {
      let query = supabase
        .from('authorized_providers')
        .select(`
          id,
          user_id,
          name,
          location_id,
          status,
          created_at,
          locations:location_id (
            id,
            name,
            city,
            state
          ),
          profiles:user_id (
            id,
            display_name,
            email
          )
        `)
        .eq('status', 'APPROVED');

      if (apUserId) {
        query = query.eq('user_id', apUserId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Fallback query failed:', error);
        return [];
      }

      return (data || []).map((provider: any) => ({
        assignment_id: provider.id,
        ap_user_id: provider.user_id,
        ap_user_name: provider.profiles?.display_name || provider.name,
        ap_user_email: provider.profiles?.email || '',
        location_id: provider.location_id,
        location_name: provider.locations?.name || 'Unknown Location',
        location_city: provider.locations?.city,
        location_state: provider.locations?.state,
        assignment_role: 'provider',
        status: 'active',
        start_date: provider.created_at.split('T')[0],
        end_date: undefined,
        team_count: 0
      }));
    } catch (fallbackError) {
      console.error('All assignment fetch methods failed:', fallbackError);
      return [];
    }
  }

  /**
   * Remove AP user assignment from a location
   */
  async removeAPUserFromLocation(apUserId: string, locationId: string): Promise<void> {
    try {
      // Try to update ap_user_location_assignments table
      const { error: assignmentError } = await supabase
        .from('ap_user_location_assignments' as any)
        .update({ status: 'inactive', updated_at: new Date().toISOString() })
        .eq('ap_user_id', apUserId)
        .eq('location_id', locationId);

      if (assignmentError) {
        console.warn('ap_user_location_assignments table not available:', assignmentError.message);
      }
    } catch (tableError) {
      console.warn('ap_user_location_assignments table not accessible');
    }

    // Always update the corresponding authorized_provider record
    const { error: providerError } = await supabase
      .from('authorized_providers')
      .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
      .eq('user_id', apUserId)
      .eq('location_id', locationId);

    if (providerError) {
      console.error('Error updating authorized_provider status:', providerError);
      throw providerError;
    }
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