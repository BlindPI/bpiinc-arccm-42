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

export class FallbackAPUserService {
  /**
   * Get all users with AP (Authorized Provider) role
   */
  async getAPUsers(): Promise<APUser[]> {
    try {
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
    } catch (err) {
      console.error('Fallback AP user fetch failed:', err);
      return [];
    }
  }

  /**
   * Get AP user assignments using direct table queries (fallback method)
   */
  async getAPUserAssignments(apUserId?: string): Promise<APUserLocationAssignment[]> {
    try {
      // First try to access the table directly
      let query = supabase
        .from('ap_user_location_assignments' as any)
        .select(`
          id,
          ap_user_id,
          location_id,
          assignment_role,
          status,
          start_date,
          end_date,
          created_at
        `);

      if (apUserId) {
        query = query.eq('ap_user_id', apUserId);
      }

      const { data: assignments, error: assignError } = await query;

      if (assignError) {
        console.warn('ap_user_location_assignments table not accessible, using authorized_providers fallback');
        return this.getAssignmentsFromAuthorizedProviders(apUserId);
      }

      if (!assignments || assignments.length === 0) {
        return [];
      }

      // Enrich with user and location data
      const enrichedAssignments: APUserLocationAssignment[] = [];

      for (const assignment of assignments) {
        // Get user data
        const { data: userData } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('id', assignment.ap_user_id)
          .single();

        // Get location data
        const { data: locationData } = await supabase
          .from('locations')
          .select('name, city, state')
          .eq('id', assignment.location_id)
          .single();

        // Count teams for this assignment
        const { count: teamCount } = await supabase
          .from('provider_team_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('provider_id', assignment.ap_user_id)
          .eq('status', 'active');

        enrichedAssignments.push({
          assignment_id: assignment.id,
          ap_user_id: assignment.ap_user_id,
          ap_user_name: userData?.display_name || 'Unknown User',
          ap_user_email: userData?.email || '',
          location_id: assignment.location_id,
          location_name: locationData?.name || 'Unknown Location',
          location_city: locationData?.city,
          location_state: locationData?.state,
          assignment_role: assignment.assignment_role,
          status: assignment.status,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          team_count: teamCount || 0
        });
      }

      return enrichedAssignments;
    } catch (err) {
      console.error('Fallback assignment fetch failed:', err);
      return this.getAssignmentsFromAuthorizedProviders(apUserId);
    }
  }

  /**
   * Fallback method using authorized_providers table
   */
  private async getAssignmentsFromAuthorizedProviders(apUserId?: string): Promise<APUserLocationAssignment[]> {
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
        console.error('Authorized providers fallback failed:', error);
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
    } catch (err) {
      console.error('All fallback methods failed:', err);
      return [];
    }
  }

  /**
   * Assign AP user to location using direct table operations
   */
  async assignAPUserToLocation(
    apUserId: string,
    locationId: string,
    assignmentRole: string = 'provider',
    endDate?: string
  ): Promise<string> {
    try {
      // First verify the AP user exists
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

      // Try to create assignment in ap_user_location_assignments table
      try {
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

        // Also create authorized_provider record
        await supabase
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
            compliance_score: 0
          });

        return assignment.id;
      } catch (tableError) {
        console.warn('ap_user_location_assignments table not available, using authorized_providers only');
        
        // Fallback: Just create authorized_provider record
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
            compliance_score: 0
          })
          .select()
          .single();

        if (providerError) throw providerError;
        return provider.id;
      }
    } catch (error: any) {
      console.error('Assignment failed:', error);
      throw error;
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

      // Always update authorized_providers (whether or not the above succeeded)
      await supabase
        .from('authorized_providers')
        .update({ status: 'INACTIVE', updated_at: new Date().toISOString() })
        .eq('user_id', apUserId)
        .eq('location_id', locationId);

      if (assignmentError) {
        console.warn('ap_user_location_assignments update failed, but authorized_providers updated');
      }
    } catch (error: any) {
      console.error('Remove assignment failed:', error);
      throw error;
    }
  }

  /**
   * Get available AP users for a location
   */
  async getAvailableAPUsersForLocation(locationId: string): Promise<APUser[]> {
    try {
      // Get all AP users
      const allAPUsers = await this.getAPUsers();
      
      // Get currently assigned users for this location
      const assignments = await this.getAPUserAssignments();
      const assignedUserIds = assignments
        .filter(a => a.location_id === locationId && a.status === 'active')
        .map(a => a.ap_user_id);

      // Return users not currently assigned to this location
      return allAPUsers.filter(user => !assignedUserIds.includes(user.id));
    } catch (error: any) {
      console.error('Get available users failed:', error);
      return [];
    }
  }
}

export const fallbackAPUserService = new FallbackAPUserService();