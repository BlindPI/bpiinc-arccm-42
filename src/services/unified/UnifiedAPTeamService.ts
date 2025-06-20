/**
 * Unified AP Team Management Service
 * Single source of truth for Location → AP User → Teams relationships
 * Replaces complex provider management with simple, reliable operations
 */

import { supabase } from '@/integrations/supabase/client';

// Clean, simplified types
export interface APUserAssignment {
  id: string;
  apUserId: string;
  locationId: string;
  locationName: string;
  isActive: boolean;
  assignedAt: string;
  assignedBy?: string;
}

export interface TeamInfo {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  locationName: string;
  assignedAPUserId: string;
  createdByAPUserId?: string;
  teamType: 'general' | 'sales' | 'support' | 'retention';
  isActive: boolean;
  memberCount: number;
  createdAt: string;
}

export interface APUserDashboard {
  apUserId: string;
  displayName: string;
  email: string;
  locations: LocationSummary[];
  totalTeams: number;
  totalMembers: number;
}

export interface LocationSummary {
  locationId: string;
  locationName: string;
  teamCount: number;
  memberCount: number;
  assignmentDate: string;
  teams: TeamInfo[];
}

export interface SystemOverview {
  totalAPUsers: number;
  assignedAPUsers: number;
  unassignedAPUsers: number;
  totalLocations: number;
  locationsWithAPUsers: number;
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
  healthScore: number;
  issues: SystemIssue[];
}

export interface SystemIssue {
  type: 'unassigned_ap_user' | 'orphaned_team' | 'empty_location';
  severity: 'warning' | 'error';
  message: string;
  affectedId: string;
  affectedName: string;
}

export class UnifiedAPTeamService {
  
  /**
   * Assign AP user to location (primary operation)
   */
  static async assignAPUserToLocation(
    apUserId: string,
    locationId: string
  ): Promise<{ success: boolean; assignmentId: string; message: string }> {
    try {
      console.log(`🎯 Assigning AP user ${apUserId} to location ${locationId}`);
      
      // Validate AP user exists and is active
      const { data: apUser, error: userError } = await supabase
        .from('profiles')
        .select('id, role, status')
        .eq('id', apUserId)
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .single();
      
      if (userError || !apUser) {
        throw new Error('User is not an active AP user');
      }
      
      // Validate location exists
      const { data: location, error: locationError } = await supabase
        .from('locations')
        .select('id')
        .eq('id', locationId)
        .single();
      
      if (locationError || !location) {
        throw new Error('Location does not exist');
      }
      
      // Create or update assignment
      const currentUser = await supabase.auth.getUser();
      const { data: assignment, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .upsert({
          ap_user_id: apUserId,
          location_id: locationId,
          is_active: true,
          assigned_by: currentUser.data.user?.id,
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ap_user_id,location_id'
        })
        .select('id')
        .single();
      
      if (assignmentError) throw assignmentError;
      
      console.log('✅ AP user assigned successfully');
      
      return {
        success: true,
        assignmentId: assignment.id,
        message: 'AP user successfully assigned to location'
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
      
      // Deactivate assignment
      const { error } = await supabase
        .from('ap_user_location_assignments')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('ap_user_id', apUserId)
        .eq('location_id', locationId);
      
      if (error) throw error;
      
      // Deactivate associated teams (using current schema)
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('location_id', locationId);
      
      if (teamError) {
        console.warn('Warning updating teams:', teamError);
      }
      
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
   * Create team for AP user at location
   */
  static async createTeam(teamData: {
    name: string;
    description?: string;
    locationId: string;
    assignedAPUserId: string;
    teamType?: 'general' | 'sales' | 'support' | 'retention';
  }): Promise<{ success: boolean; teamId: string; message: string }> {
    try {
      console.log('🏗️ Creating team:', teamData);
      
      // Validate AP user is assigned to this location
      const { data: assignment, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .select('id')
        .eq('ap_user_id', teamData.assignedAPUserId)
        .eq('location_id', teamData.locationId)
        .eq('status', 'active')
        .single();
      
      if (assignmentError || !assignment) {
        throw new Error('AP user is not assigned to this location');
      }
      
      // Create team using current schema
      const currentUser = await supabase.auth.getUser();
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamData.name,
          description: teamData.description,
          location_id: teamData.locationId,
          team_type: teamData.teamType || 'general',
          status: 'active',
          created_by: currentUser.data.user?.id
        })
        .select('id')
        .single();
      
      if (teamError) throw teamError;
      
      console.log('✅ Team created successfully');
      
      return {
        success: true,
        teamId: team.id,
        message: `Team "${teamData.name}" created successfully`
      };
      
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }
  }
  
  /**
   * Get comprehensive AP user dashboard data
   */
  static async getAPUserDashboard(apUserId: string): Promise<APUserDashboard> {
    try {
      console.log(`📊 Getting dashboard data for AP user ${apUserId}`);
      
      // Get user profile
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('id', apUserId)
        .single();
      
      if (userError || !userProfile) {
        throw new Error('AP user not found');
      }
      
      // Get location assignments
      const { data: assignments, error: assignmentError } = await supabase
        .from('ap_user_location_assignments')
        .select(`
          location_id,
          assigned_at,
          locations!inner(id, name)
        `)
        .eq('ap_user_id', apUserId)
        .eq('status', 'active');
      
      if (assignmentError) throw assignmentError;
      
      const locations: LocationSummary[] = [];
      
      for (const assignment of assignments || []) {
        const location = assignment.locations;
        if (!location) continue;
        
        // Get teams for this location
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select(`
            id, name, description, team_type, status, created_at
          `)
          .eq('location_id', location.id)
          .eq('status', 'active');
        
        if (teamsError) {
          console.warn('Error getting teams:', teamsError);
          continue;
        }
        
        // Get member counts for each team
        const teamInfos: TeamInfo[] = [];
        let totalMemberCount = 0;
        
        for (const team of teams || []) {
          const { data: members, error: memberError } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', team.id)
            .eq('status', 'active');
          
          const memberCount = members?.length || 0;
          totalMemberCount += memberCount;
          
          teamInfos.push({
            id: team.id,
            name: team.name,
            description: team.description,
            locationId: location.id,
            locationName: location.name,
            assignedAPUserId: apUserId,
            teamType: team.team_type || 'general',
            isActive: team.status === 'active',
            memberCount,
            createdAt: team.created_at
          });
        }
        
        locations.push({
          locationId: location.id,
          locationName: location.name,
          teamCount: teams?.length || 0,
          memberCount: totalMemberCount,
          assignmentDate: assignment.assigned_at,
          teams: teamInfos
        });
      }
      
      const totalTeams = locations.reduce((sum, loc) => sum + loc.teamCount, 0);
      const totalMembers = locations.reduce((sum, loc) => sum + loc.memberCount, 0);
      
      console.log(`✅ Dashboard data retrieved: ${locations.length} locations, ${totalTeams} teams`);
      
      return {
        apUserId,
        displayName: userProfile.display_name || 'Unknown',
        email: userProfile.email,
        locations,
        totalTeams,
        totalMembers
      };
      
    } catch (error: any) {
      console.error('❌ Error getting AP user dashboard:', error);
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }
  
  /**
   * Get system overview for admin dashboard
   */
  static async getSystemOverview(): Promise<SystemOverview> {
    try {
      console.log('📈 Getting system overview...');
      
      // Get AP users
      const { data: apUsers, error: apUsersError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE');
      
      if (apUsersError) throw apUsersError;
      
      // Get assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ap_user_location_assignments')
        .select('ap_user_id, location_id')
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      // Get locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name');
      
      if (locationsError) throw locationsError;
      
      // Get teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, location_id')
        .eq('status', 'active');
      
      if (teamsError) throw teamsError;
      
      // Get team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('id, team_id')
        .eq('status', 'active');
      
      if (membersError) throw membersError;
      
      const totalAPUsers = apUsers?.length || 0;
      const assignedAPUserIds = new Set(assignments?.map(a => a.ap_user_id) || []);
      const assignedAPUsers = assignedAPUserIds.size;
      const unassignedAPUsers = totalAPUsers - assignedAPUsers;
      
      const totalLocations = locations?.length || 0;
      const assignedLocationIds = new Set(assignments?.map(a => a.location_id) || []);
      const locationsWithAPUsers = assignedLocationIds.size;
      
      const totalTeams = teams?.length || 0;
      const totalMembers = members?.length || 0;
      
      // Calculate health score
      const healthScore = totalAPUsers > 0 ? Math.round((assignedAPUsers / totalAPUsers) * 100) : 100;
      
      // Identify issues
      const issues: SystemIssue[] = [];
      
      // Unassigned AP users
      const unassignedUsers = apUsers?.filter(user => !assignedAPUserIds.has(user.id)) || [];
      for (const user of unassignedUsers) {
        issues.push({
          type: 'unassigned_ap_user',
          severity: 'warning',
          message: 'AP user not assigned to any location',
          affectedId: user.id,
          affectedName: user.display_name || user.email
        });
      }
      
      // Empty locations
      const emptyLocations = locations?.filter(location => !assignedLocationIds.has(location.id)) || [];
      for (const location of emptyLocations) {
        issues.push({
          type: 'empty_location',
          severity: 'warning',
          message: 'Location has no assigned AP users',
          affectedId: location.id,
          affectedName: location.name
        });
      }
      
      console.log(`✅ System overview: ${totalAPUsers} AP users, ${assignedAPUsers} assigned, ${healthScore}% health`);
      
      return {
        totalAPUsers,
        assignedAPUsers,
        unassignedAPUsers,
        totalLocations,
        locationsWithAPUsers,
        totalTeams,
        activeTeams: totalTeams,
        totalMembers,
        healthScore,
        issues
      };
      
    } catch (error: any) {
      console.error('❌ Error getting system overview:', error);
      throw new Error(`Failed to get system overview: ${error.message}`);
    }
  }
  
  /**
   * Get all available locations for assignment
   */
  static async getAvailableLocations(): Promise<Array<{ id: string; name: string; assignedAPUsers: number }>> {
    try {
      // Get all locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationsError) throw locationsError;
      
      // Get assignment counts for each location
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ap_user_location_assignments')
        .select('location_id')
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      // Count assignments per location
      const assignmentCounts = new Map<string, number>();
      assignments?.forEach(assignment => {
        const count = assignmentCounts.get(assignment.location_id) || 0;
        assignmentCounts.set(assignment.location_id, count + 1);
      });
      
      return (locations || []).map(location => ({
        id: location.id,
        name: location.name,
        assignedAPUsers: assignmentCounts.get(location.id) || 0
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting available locations:', error);
      throw new Error(`Failed to get locations: ${error.message}`);
    }
  }
  
  /**
   * Get all AP users for assignment
   */
  static async getAPUsers(): Promise<Array<{ id: string; displayName: string; email: string; assignmentStatus: string }>> {
    try {
      // Get all AP users
      const { data: apUsers, error: apUsersError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (apUsersError) throw apUsersError;
      
      // Get assignments to determine status
      const { data: assignments, error: assignmentsError } = await supabase
        .from('ap_user_location_assignments')
        .select('ap_user_id')
        .eq('status', 'active');
      
      if (assignmentsError) throw assignmentsError;
      
      const assignedUserIds = new Set(assignments?.map(a => a.ap_user_id) || []);
      
      return (apUsers || []).map(user => ({
        id: user.id,
        displayName: user.display_name || user.email,
        email: user.email,
        assignmentStatus: assignedUserIds.has(user.id) ? 'assigned' : 'unassigned'
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting AP users:', error);
      throw new Error(`Failed to get AP users: ${error.message}`);
    }
  }
  
  /**
   * Bulk assign multiple AP users to locations
   */
  static async bulkAssignAPUsers(
    assignments: Array<{ apUserId: string; locationId: string }>
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] as string[] };
    
    for (const assignment of assignments) {
      try {
        await this.assignAPUserToLocation(assignment.apUserId, assignment.locationId);
        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${assignment.apUserId}: ${error.message}`);
      }
    }
    
    return results;
  }
}