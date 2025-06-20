/**
 * Corrected AP Provider Service
 * FIXES THE FUNDAMENTAL ISSUE: AP User IS the Provider
 * 
 * This service eliminates the conceptual confusion between AP Users and Providers
 * that was causing all Dashboard Integrity Panel errors.
 */

import { supabase } from '@/integrations/supabase/client';

// Corrected Types - AP User IS the Provider
export interface APUser {
  id: string;
  display_name: string;
  email: string;
  role: 'AP';
  status: 'ACTIVE' | 'INACTIVE';
  organization?: string;
  phone?: string;
  created_at: string;
}

export interface LocationAssignment {
  id: string;
  ap_user_id: string;
  location_id: string;
  location_name: string;
  assigned_at: string;
  status: 'active' | 'inactive';
  notes?: string;
}

export interface TeamDirectlyAssigned {
  id: string;
  name: string;
  description?: string;
  location_id: string;
  location_name: string;
  assigned_ap_user_id: string; // Direct reference - no provider middleman
  team_type: 'general' | 'sales' | 'support' | 'retention';
  member_count: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface APUserDashboard {
  ap_user_id: string;
  display_name: string;
  email: string;
  organization?: string;
  locations: Array<{
    location_id: string;
    location_name: string;
    assigned_at: string;
    team_count: number;
    member_count: number;
    teams: TeamDirectlyAssigned[];
  }>;
  summary: {
    total_locations: number;
    total_teams: number;
    total_members: number;
  };
}

export interface SystemHealth {
  total_ap_users: number;
  assigned_ap_users: number;
  unassigned_ap_users: number;
  total_locations: number;
  locations_with_ap_users: number;
  total_teams: number;
  teams_with_ap_users: number;
  health_score: number;
  issues: Array<{
    type: 'unassigned_ap_user' | 'orphaned_team' | 'empty_location';
    severity: 'warning' | 'error';
    message: string;
    affected_id: string;
    affected_name: string;
  }>;
}

export class CorrectedAPProviderService {
  
  /**
   * Get all AP users (they ARE the providers)
   */
  static async getAPUsers(): Promise<APUser[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, email, role, status, organization, phone, created_at')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Error fetching AP users:', error);
      throw new Error(`Failed to fetch AP users: ${error.message}`);
    }
  }
  
  /**
   * Assign AP user to location (they ARE the provider for that location)
   */
  static async assignAPUserToLocation(
    apUserId: string, 
    locationId: string, 
    notes?: string
  ): Promise<{ success: boolean; assignmentId: string; message: string }> {
    try {
      console.log(`🎯 Assigning AP user ${apUserId} to location ${locationId}`);
      
      const { data: assignmentId, error } = await supabase
        .rpc('assign_ap_user_to_location_direct', {
          p_ap_user_id: apUserId,
          p_location_id: locationId,
          p_assigned_by: (await supabase.auth.getUser()).data.user?.id,
          p_notes: notes
        });
      
      if (error) throw error;
      
      console.log('✅ AP user assigned successfully - no sync needed!');
      
      return {
        success: true,
        assignmentId,
        message: 'AP user assigned to location successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Error assigning AP user:', error);
      throw new Error(`Failed to assign AP user: ${error.message}`);
    }
  }
  
  /**
   * Remove AP user from location
   */
  static async removeAPUserFromLocation(
    apUserId: string, 
    locationId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log(`🗑️ Removing AP user ${apUserId} from location ${locationId}`);
      
      // Simple update - no complex sync needed
      const { error } = await supabase
        .from('ap_user_location_assignments')
        .update({ 
          status: 'inactive', 
          updated_at: new Date().toISOString() 
        })
        .eq('ap_user_id', apUserId)
        .eq('location_id', locationId);
      
      if (error) throw error;
      
      // Deactivate teams assigned to this AP user at this location
      await supabase
        .from('teams')
        .update({ 
          status: 'inactive', 
          updated_at: new Date().toISOString() 
        })
        .eq('assigned_ap_user_id', apUserId)
        .eq('location_id', locationId);
      
      console.log('✅ AP user removed from location');
      
      return {
        success: true,
        message: 'AP user removed from location successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Error removing AP user:', error);
      throw new Error(`Failed to remove AP user: ${error.message}`);
    }
  }
  
  /**
   * Create team directly assigned to AP user (no provider conversion needed)
   */
  static async createTeamForAPUser(teamData: {
    name: string;
    description?: string;
    location_id: string;
    assigned_ap_user_id: string;
    team_type?: 'general' | 'sales' | 'support' | 'retention';
  }): Promise<{ success: boolean; teamId: string; message: string }> {
    try {
      console.log('🏗️ Creating team directly assigned to AP user:', teamData);
      
      const { data: teamId, error } = await supabase
        .rpc('create_team_for_ap_user_direct', {
          p_team_name: teamData.name,
          p_location_id: teamData.location_id,
          p_assigned_ap_user_id: teamData.assigned_ap_user_id,
          p_team_type: teamData.team_type || 'general',
          p_description: teamData.description
        });
      
      if (error) throw error;
      
      console.log('✅ Team created with direct AP user assignment');
      
      return {
        success: true,
        teamId,
        message: `Team "${teamData.name}" created successfully`
      };
      
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }
  }
  
  /**
   * Get comprehensive AP user dashboard (all their locations and teams)
   */
  static async getAPUserDashboard(apUserId: string): Promise<APUserDashboard> {
    try {
      console.log(`📊 Getting dashboard for AP user ${apUserId}`);
      
      // Get AP user profile
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name, email, organization')
        .eq('id', apUserId)
        .eq('role', 'AP')
        .single();
      
      if (userError || !apUser) {
        throw new Error('AP user not found');
      }
      
      // Get dashboard data using the direct function
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_ap_user_dashboard_direct', { p_ap_user_id: apUserId });
      
      if (dashboardError) throw dashboardError;
      
      // Get detailed team info for each location
      const locations = [];
      let totalTeams = 0;
      let totalMembers = 0;
      
      for (const locationData of dashboardData || []) {
        // Get teams directly assigned to this AP user at this location
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id, name, description, team_type, status, created_at,
            locations!inner(name)
          `)
          .eq('location_id', locationData.location_id)
          .eq('assigned_ap_user_id', apUserId)
          .eq('status', 'active');
        
        if (teamsError) {
          console.warn('Error getting teams:', teamsError);
          continue;
        }
        
        // Get member counts for each team
        const teamsWithCounts: TeamDirectlyAssigned[] = [];
        let locationMemberCount = 0;
        
        for (const team of teams || []) {
          const { data: members } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', team.id)
            .eq('status', 'active');
          
          const memberCount = members?.length || 0;
          locationMemberCount += memberCount;
          
          teamsWithCounts.push({
            id: team.id,
            name: team.name,
            description: team.description,
            location_id: locationData.location_id,
            location_name: locationData.location_name,
            assigned_ap_user_id: apUserId,
            team_type: team.team_type || 'general',
            member_count: memberCount,
            status: team.status,
            created_at: team.created_at
          });
        }
        
        locations.push({
          location_id: locationData.location_id,
          location_name: locationData.location_name,
          assigned_at: locationData.assigned_at,
          team_count: teamsWithCounts.length,
          member_count: locationMemberCount,
          teams: teamsWithCounts
        });
        
        totalTeams += teamsWithCounts.length;
        totalMembers += locationMemberCount;
      }
      
      console.log(`✅ Dashboard retrieved: ${locations.length} locations, ${totalTeams} teams`);
      
      return {
        ap_user_id: apUserId,
        display_name: apUser.display_name || 'Unknown',
        email: apUser.email,
        organization: apUser.organization,
        locations,
        summary: {
          total_locations: locations.length,
          total_teams: totalTeams,
          total_members: totalMembers
        }
      };
      
    } catch (error: any) {
      console.error('❌ Error getting AP user dashboard:', error);
      throw new Error(`Failed to get dashboard: ${error.message}`);
    }
  }
  
  /**
   * Get system health overview (no sync issues!)
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    try {
      console.log('📈 Getting system health overview...');
      
      // Get data from the unified views
      const { data: apOverview, error: apError } = await supabase
        .from('ap_user_management_overview')
        .select('*');
      
      if (apError) throw apError;
      
      const { data: locationOverview, error: locationError } = await supabase
        .from('location_ap_user_overview')
        .select('*');
      
      if (locationError) throw locationError;
      
      const totalAPUsers = apOverview?.length || 0;
      const assignedAPUsers = apOverview?.filter(u => u.assignment_status === 'assigned').length || 0;
      const unassignedAPUsers = totalAPUsers - assignedAPUsers;
      
      const totalLocations = locationOverview?.length || 0;
      const locationsWithAPUsers = locationOverview?.filter(l => l.assigned_ap_users > 0).length || 0;
      
      const totalTeams = apOverview?.reduce((sum, user) => sum + (user.managed_teams || 0), 0) || 0;
      const teamsWithAPUsers = totalTeams; // All teams have direct AP user assignment
      
      // Calculate health score (no sync issues to worry about!)
      const healthScore = totalAPUsers > 0 ? Math.round((assignedAPUsers / totalAPUsers) * 100) : 100;
      
      // Identify issues (much simpler now)
      const issues = [];
      
      // Unassigned AP users
      const unassignedUsers = apOverview?.filter(u => u.assignment_status === 'unassigned') || [];
      for (const user of unassignedUsers) {
        issues.push({
          type: 'unassigned_ap_user' as const,
          severity: 'warning' as const,
          message: 'AP user not assigned to any location',
          affected_id: user.ap_user_id,
          affected_name: user.display_name
        });
      }
      
      // Empty locations
      const emptyLocations = locationOverview?.filter(l => l.assigned_ap_users === 0) || [];
      for (const location of emptyLocations) {
        issues.push({
          type: 'empty_location' as const,
          severity: 'warning' as const,
          message: 'Location has no assigned AP users',
          affected_id: location.location_id,
          affected_name: location.location_name
        });
      }
      
      console.log(`✅ System health: ${totalAPUsers} AP users, ${assignedAPUsers} assigned, ${healthScore}% health, ${issues.length} issues`);
      
      return {
        total_ap_users: totalAPUsers,
        assigned_ap_users: assignedAPUsers,
        unassigned_ap_users: unassignedAPUsers,
        total_locations: totalLocations,
        locations_with_ap_users: locationsWithAPUsers,
        total_teams: totalTeams,
        teams_with_ap_users: teamsWithAPUsers,
        health_score: healthScore,
        issues
      };
      
    } catch (error: any) {
      console.error('❌ Error getting system health:', error);
      throw new Error(`Failed to get system health: ${error.message}`);
    }
  }
  
  /**
   * Get available locations for assignment
   */
  static async getAvailableLocations(): Promise<Array<{ id: string; name: string; assigned_ap_users: number }>> {
    try {
      const { data: locations, error } = await supabase
        .from('location_ap_user_overview')
        .select('location_id, location_name, assigned_ap_users')
        .order('location_name');
      
      if (error) throw error;
      
      return (locations || []).map(loc => ({
        id: loc.location_id,
        name: loc.location_name,
        assigned_ap_users: loc.assigned_ap_users || 0
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting locations:', error);
      throw new Error(`Failed to get locations: ${error.message}`);
    }
  }
  
  /**
   * Bulk assign AP users to locations
   */
  static async bulkAssignAPUsers(
    assignments: Array<{ ap_user_id: string; location_id: string; notes?: string }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const assignment of assignments) {
      try {
        await this.assignAPUserToLocation(
          assignment.ap_user_id, 
          assignment.location_id, 
          assignment.notes
        );
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${assignment.ap_user_id}: ${error.message}`);
      }
    }
    
    return results;
  }
}

export default CorrectedAPProviderService;