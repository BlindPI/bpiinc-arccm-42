/**
 * CLEAN SLATE AP TEAM SERVICE
 * Single source of truth for rebuilt Location → AP User → Teams relationships
 * Matches clean database schema exactly - no field mismatches
 */

import { supabase } from '@/integrations/supabase/client';

// Clean, validated types matching new schema
export interface APUserAssignment {
  id: string;
  apUserId: string;
  locationId: string;
  status: 'active' | 'inactive';
  assignedAt: string;
  assignedBy?: string;
}

export interface CleanTeam {
  id: string;
  name: string;
  description?: string;
  locationId: string;
  assignedAPUserId?: string;
  status: 'active' | 'inactive' | 'archived';
  teamType: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface APUserDashboard {
  apUserId: string;
  displayName: string;
  email: string;
  locations: Array<{
    locationId: string;
    locationName: string;
    teamCount: number;
    memberCount: number;
  }>;
}

export class CleanAPTeamService {
  
  /**
   * Step 1: Assign AP user to location (uses clean database function)
   */
  static async assignAPUserToLocation(
    apUserId: string,
    locationId: string
  ): Promise<{ success: boolean; assignmentId: string; message: string }> {
    try {
      console.log(`🎯 Assigning AP user ${apUserId} to location ${locationId}`);
      
      // Use the clean database function (with new unique name)
      const { data, error } = await supabase.rpc('assign_ap_user_to_location', {
        p_ap_user_id: apUserId,
        p_location_id: locationId
      });
      
      if (error) throw error;
      
      console.log('✅ AP user assigned successfully');
      
      return {
        success: true,
        assignmentId: data,
        message: 'AP user successfully assigned to location'
      };
      
    } catch (error: any) {
      console.error('❌ Error assigning AP user:', error);
      throw new Error(`Failed to assign AP user: ${error.message}`);
    }
  }
  
  /**
   * Step 2: Create team with AP user (uses clean database function)
   */
  static async createTeamWithAPUser(teamData: {
    name: string;
    description?: string;
    locationId: string;
    apUserId: string;
  }): Promise<{ success: boolean; teamId: string; message: string }> {
    try {
      console.log('🏗️ Creating team with AP user:', teamData);
      
      // Use the clean database function (with new unique name)
      const { data, error } = await supabase.rpc('create_team_with_ap_user', {
        p_name: teamData.name,
        p_description: teamData.description || '',
        p_location_id: teamData.locationId,
        p_ap_user_id: teamData.apUserId
      });
      
      if (error) throw error;
      
      console.log('✅ Team created successfully');
      
      return {
        success: true,
        teamId: data,
        message: `Team "${teamData.name}" created successfully`
      };
      
    } catch (error: any) {
      console.error('❌ Error creating team:', error);
      throw new Error(`Failed to create team: ${error.message}`);
    }
  }
  
  /**
   * Step 3: Get AP user dashboard (uses clean database function)
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
      
      // Use the clean database function (with new unique name)
      const { data: locationData, error: locationError } = await supabase
        .rpc('get_ap_user_dashboard', {
          p_ap_user_id: apUserId
        });
      
      if (locationError) throw locationError;
      
      const locations = (locationData || []).map((loc: any) => ({
        locationId: loc.location_id,
        locationName: loc.location_name,
        teamCount: parseInt(loc.team_count) || 0,
        memberCount: parseInt(loc.member_count) || 0
      }));
      
      console.log(`✅ Dashboard data retrieved: ${locations.length} locations`);
      
      return {
        apUserId,
        displayName: userProfile.display_name || userProfile.email,
        email: userProfile.email,
        locations
      };
      
    } catch (error: any) {
      console.error('❌ Error getting AP user dashboard:', error);
      throw new Error(`Failed to get dashboard data: ${error.message}`);
    }
  }
  
  /**
   * Get all teams for AP user (direct table access)
   */
  static async getAPUserTeams(apUserId: string): Promise<CleanTeam[]> {
    try {
      const { data: teams, error } = await supabase
        .from('teams')
        .select('*')
        .eq('assigned_ap_user_id', apUserId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (teams || []).map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        locationId: team.location_id,
        assignedAPUserId: team.assigned_ap_user_id,
        status: team.status,
        teamType: team.team_type,
        createdBy: team.created_by,
        createdAt: team.created_at,
        updatedAt: team.updated_at
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting AP user teams:', error);
      throw new Error(`Failed to get teams: ${error.message}`);
    }
  }
  
  /**
   * Get team members (direct table access)
   */
  static async getTeamMembers(teamId: string): Promise<Array<TeamMember & { displayName: string; email: string }>> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          status,
          joined_at,
          profiles!inner(display_name, email)
        `)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .order('joined_at', { ascending: true });
      
      if (error) throw error;
      
      return (members || []).map(member => ({
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        role: member.role,
        status: member.status,
        joinedAt: member.joined_at,
        displayName: member.profiles?.display_name || member.profiles?.email || 'Unknown',
        email: member.profiles?.email || ''
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting team members:', error);
      throw new Error(`Failed to get team members: ${error.message}`);
    }
  }
  
  /**
   * Add member to team (direct table access)
   */
  static async addTeamMember(
    teamId: string,
    userId: string,
    role: string = 'member'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active'
        });
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Team member added successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Error adding team member:', error);
      throw new Error(`Failed to add team member: ${error.message}`);
    }
  }
  
  /**
   * Remove member from team (direct table access)
   */
  static async removeTeamMember(
    teamId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactive' })
        .eq('team_id', teamId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      return {
        success: true,
        message: 'Team member removed successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Error removing team member:', error);
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  }
  
  /**
   * Get available AP users for location assignment
   */
  static async getAvailableAPUsers(): Promise<Array<{
    id: string;
    displayName: string;
    email: string;
    isAssigned: boolean;
  }>> {
    try {
      // Get all AP users
      const { data: apUsers, error: apError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('role', 'AP')
        .eq('status', 'ACTIVE')
        .order('display_name');
      
      if (apError) throw apError;
      
      // Get assigned user IDs
      const { data: assignments, error: assignError } = await supabase
        .from('ap_user_location_assignments')
        .select('ap_user_id')
        .eq('status', 'active');
      
      if (assignError) throw assignError;
      
      const assignedIds = new Set(assignments?.map(a => a.ap_user_id) || []);
      
      return (apUsers || []).map(user => ({
        id: user.id,
        displayName: user.display_name || user.email,
        email: user.email,
        isAssigned: assignedIds.has(user.id)
      }));
      
    } catch (error: any) {
      console.error('❌ Error getting available AP users:', error);
      throw new Error(`Failed to get AP users: ${error.message}`);
    }
  }
  
  /**
   * Get available locations
   */
  static async getAvailableLocations(): Promise<Array<{
    id: string;
    name: string;
    assignedAPUsers: number;
  }>> {
    try {
      // Get all locations
      const { data: locations, error: locationError } = await supabase
        .from('locations')
        .select('id, name')
        .order('name');
      
      if (locationError) throw locationError;
      
      // Get assignment counts
      const { data: assignments, error: assignError } = await supabase
        .from('ap_user_location_assignments')
        .select('location_id')
        .eq('status', 'active');
      
      if (assignError) throw assignError;
      
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
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    totalAPUsers: number;
    assignedAPUsers: number;
    totalLocations: number;
    locationsWithAPUsers: number;
    totalTeams: number;
    totalMembers: number;
    healthScore: number;
  }> {
    try {
      // Get counts in parallel
      const [apUsersResult, assignmentsResult, locationsResult, teamsResult, membersResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'AP').eq('status', 'ACTIVE'),
        supabase.from('ap_user_location_assignments').select('ap_user_id, location_id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('locations').select('id', { count: 'exact' }),
        supabase.from('teams').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('team_members').select('id', { count: 'exact' }).eq('status', 'active')
      ]);
      
      const totalAPUsers = apUsersResult.count || 0;
      const assignments = assignmentsResult.data || [];
      const assignedAPUsers = new Set(assignments.map(a => a.ap_user_id)).size;
      const totalLocations = locationsResult.count || 0;
      const locationsWithAPUsers = new Set(assignments.map(a => a.location_id)).size;
      const totalTeams = teamsResult.count || 0;
      const totalMembers = membersResult.count || 0;
      
      const healthScore = totalAPUsers > 0 ? Math.round((assignedAPUsers / totalAPUsers) * 100) : 100;
      
      return {
        totalAPUsers,
        assignedAPUsers,
        totalLocations,
        locationsWithAPUsers,
        totalTeams,
        totalMembers,
        healthScore
      };
      
    } catch (error: any) {
      console.error('❌ Error getting system health:', error);
      throw new Error(`Failed to get system health: ${error.message}`);
    }
  }
}

// Browser console integration for testing
if (typeof window !== 'undefined') {
  (window as any).CleanAPTeamService = CleanAPTeamService;
  console.log('🧹 CleanAPTeamService available in browser console');
  console.log('🧪 Try: CleanAPTeamService.getSystemHealth()');
}