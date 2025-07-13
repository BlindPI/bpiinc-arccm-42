import { supabase } from '@/integrations/supabase/client';
import type { DatabaseUserRole } from '@/types/database-roles';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';
import { SafeTeamService } from './safeTeamService';

// Re-export types for easier importing
export type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';

// RPC Function Response Interfaces
interface BulkAddMembersResponse {
  success_count: number;
  failed_users: string[];
  error_messages: string[];
}

interface TeamAnalyticsResponse {
  total_teams: number;
  total_members: number;
  active_teams: number;
  inactive_teams: number;
  performance_average: number;
  compliance_score: number;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
  location_id?: string;
  team_type?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
  location_id?: string;
  team_type?: string;
  status?: 'active' | 'inactive' | 'archived';
}

export interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  role: string;
  joined_at: string;
  profile?: {
    display_name: string;
    email: string;
    role: DatabaseUserRole;
  };
}

export interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
}

export interface ComplianceMetrics {
  overallCompliance: number;
  certificationCompliance: number;
  trainingCompliance: number;
  documentationCompliance: number;
}

/**
 * Unified Team Service - Single source of truth for all team operations
 * Consolidates functionality from:
 * - realTeamService
 * - enhancedTeamManagementService
 * - AdminTeamService
 * - teamManagementService
 * - realTeamDataService
 * - functionalTeamService
 * - simplifiedTeamService
 * - fallbackTeamService
 */
export class UnifiedTeamService {
  /**
   * Get teams based on user role and permissions
   * Replaces multiple scattered getTeams methods
   */
  static async getTeams(userRole: DatabaseUserRole, userId: string): Promise<EnhancedTeam[]> {
    try {
      // For AP users, filter teams based on provider assignments with complete data
      if (userRole === 'AP') {
        console.log('🔍 UNIFIEDTEAMSERVICE: Loading teams for AP user with provider filtering...');
        
        // Get the provider record for this user
        const { data: providerData, error: providerError } = await supabase
          .from('authorized_providers')
          .select('id, name, provider_type')
          .eq('user_id', userId)
          .single();

        if (providerError || !providerData) {
          console.error('Error fetching provider record:', providerError);
          return [];
        }

        // Get teams assigned to this provider with complete relationships
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('provider_team_assignments')
          .select(`
            team_id,
            assignment_role,
            status,
            assigned_at,
            teams!inner (
              *,
              locations (
                id,
                name,
                address,
                city,
                state,
                postal_code
              ),
              team_members!team_members_team_id_fkey (
                id,
                user_id,
                role,
                status,
                assignment_start_date,
                team_position,
                profiles!team_members_user_id_fkey (
                  id,
                  display_name,
                  role,
                  email
                )
              )
            )
          `)
          .eq('provider_id', providerData.id)
          .eq('status', 'active');

        if (assignmentError) {
          console.error('Error fetching provider team assignments:', assignmentError);
          return [];
        }

        const teams = (assignmentData || []).map((assignment: any) => ({
          ...assignment.teams,
          location: assignment.teams.locations,
          provider: assignment.teams.authorized_providers,
          members: assignment.teams.team_members || [],
          member_count: (assignment.teams.team_members || []).filter((m: any) => m.status === 'active').length,
          provider_assignment: {
            role: assignment.assignment_role,
            status: assignment.status,
            assigned_at: assignment.assigned_at
          }
        }));

        console.log(`🔍 UNIFIEDTEAMSERVICE: Found ${teams.length} teams for AP user (provider-filtered)`);
        return teams as unknown as EnhancedTeam[];
      }

      // For SA/AD users, use comprehensive database query with all relationships
      console.log('🔍 UNIFIEDTEAMSERVICE: Loading teams with comprehensive data access...');
      
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select(`
          *,
          locations (
            id,
            name,
            address,
            city,
            state,
            postal_code
          ),
          team_members!team_members_team_id_fkey (
            id,
            user_id,
            role,
            status,
            assignment_start_date,
            team_position,
            profiles!team_members_user_id_fkey (
              id,
              display_name,
              role,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
        throw teamsError;
      }

      const teams = (teamsData || []).map((team: any) => ({
        ...team,
        location: team.locations,
        members: team.team_members || [],
        member_count: (team.team_members || []).filter((m: any) => m.status === 'active').length
      }));

      console.log(`🔍 UNIFIEDTEAMSERVICE: Found ${teams.length} teams with comprehensive access`);
      return teams as unknown as EnhancedTeam[];
    } catch (error) {
      console.error('UnifiedTeamService.getTeams error:', error);
      throw error;
    }
  }

  /**
   * Get enhanced teams data with analytics
   * Replaces RealTeamDataService.getEnhancedTeams
   */
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;
      
      return (data || []).map((item: any) => item.team_data);
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  /**
   * Create a new team with validation
   * Consolidates team creation logic
   */
  static async createTeam(teamData: CreateTeamRequest): Promise<EnhancedTeam> {
    console.log('🔨 UNIFIEDTEAMSERVICE: Creating team with data:', teamData);
    // Use SafeTeamService which has proven direct database access
    const result = await SafeTeamService.createTeamSafely(teamData);
    return result as unknown as EnhancedTeam;
  }

  /**
   * Update an existing team
   * Consolidates team update logic
   */
  static async updateTeam(teamId: string, updates: UpdateTeamRequest): Promise<EnhancedTeam> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .select(`
          *,
          locations(name, address)
        `)
        .single();

      if (error) throw error;

      return data as unknown as EnhancedTeam;
    } catch (error) {
      console.error('Error updating team:', error);
      throw error;
    }
  }

  /**
   * Delete a team (SA only)
   * Implements proper authorization checks
   */
  static async deleteTeam(teamId: string): Promise<void> {
    // Use SafeTeamService which has proven direct database access
    await SafeTeamService.deleteTeamSafely(teamId);
  }

  /**
   * Archive/restore team
   * Implements team lifecycle management
   */
  static async archiveTeam(teamId: string, archive: boolean = true): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({ status: archive ? 'archived' : 'active' })
        .eq('id', teamId);

      if (error) throw error;
    } catch (error) {
      console.error('Error archiving team:', error);
      throw error;
    }
  }

  /**
   * Get team members with profiles
   * Replaces scattered member fetching logic
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    // Use SafeTeamService which has proven direct database access
    return await SafeTeamService.getTeamMembersSafely(teamId) as unknown as TeamMember[];
  }

  /**
   * Add member to team
   * Implements proper validation and workflows
   */
  static async addMember(teamId: string, userId: string, role: string = 'member'): Promise<void> {
    // Use SafeTeamService which has proven direct database access
    await SafeTeamService.addMemberSafely(teamId, userId, role);
  }

  /**
   * Remove member from team
   * Implements proper authorization checks
   */
  static async removeMember(teamId: string, userId: string): Promise<void> {
    // Use SafeTeamService which has proven direct database access
    await SafeTeamService.removeMemberSafely(teamId, userId);
  }

  /**
   * Bulk member operations
   * Consolidates bulk operation logic
   */
  static async bulkAddMembers(teamId: string, userIds: string[]): Promise<void> {
    // Use direct database operations instead of failing RPC
    for (const userId of userIds) {
      try {
        await SafeTeamService.addMemberSafely(teamId, userId, 'member');
      } catch (error) {
        console.error(`Error adding user ${userId} to team:`, error);
        // Continue with other users instead of failing entirely
      }
    }
  }

  /**
   * Get available users for team (not already members)
   * Uses direct database access
   */
  static async getAvailableUsers(teamId: string): Promise<User[]> {
    // Use SafeTeamService which has proven direct database access
    return SafeTeamService.getAvailableUsers(teamId);
  }

  /**
   * Assign provider to team
   * Implements provider-team relationship management
   */
  static async assignProvider(teamId: string, providerId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('assign_provider_to_team', {
        p_team_id: teamId,
        p_provider_id: parseInt(providerId),
        p_assignment_role: 'primary',
        p_oversight_level: 'standard',
        p_assigned_by: 'system'
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning provider to team:', error);
      throw error;
    }
  }

  /**
   * Get teams for a specific provider
   * Replaces provider-specific team fetching
   */
  static async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(name, address)
        `)
        .eq('created_by', providerId);

      if (error) throw error;

      return (data as unknown as EnhancedTeam[]) || [];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      return [];
    }
  }

  /**
   * Get comprehensive team analytics
   * Consolidates analytics from multiple services
   */
  static async getTeamAnalytics(teamId?: string): Promise<TeamAnalytics> {
    try {
      let data, error;

      if (teamId) {
        // Get specific team analytics using existing function
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        ({ data, error } = await supabase.rpc('calculate_enhanced_team_performance_metrics', {
          p_team_id: teamId,
          p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
          p_end_date: new Date().toISOString().split('T')[0]
        }));
      } else {
        // Get global team analytics - use basic queries if function doesn't exist
        try {
          // Use SafeTeamService which has proven direct database access
          return await SafeTeamService.getAnalyticsSafely();
        } catch (analyticsError) {
          console.error('Analytics query failed:', analyticsError);
          throw analyticsError;
        }
      }

      if (error) throw error;

      const analyticsData = this.safeParseJsonResponse(data);
      
      return {
        totalTeams: analyticsData.total_teams || 0,
        totalMembers: analyticsData.total_members || 0,
        averagePerformance: analyticsData.performance_average || 0,
        averageCompliance: analyticsData.compliance_score || 0,
        teamsByLocation: analyticsData.teamsByLocation || {},
        performanceByTeamType: analyticsData.performanceByTeamType || {}
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {}
      };
    }
  }

  /**
   * Get team performance metrics
   * Replaces scattered performance tracking
   */
  static async getTeamPerformanceMetrics(teamId: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const thirtyDaysAgo = startDate || new Date();
      if (!startDate) {
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      }
      
      const { data, error } = await supabase.rpc('calculate_team_performance_metrics', {
        p_team_id: teamId,
        p_start_date: thirtyDaysAgo.toISOString().split('T')[0],
        p_end_date: (endDate || new Date()).toISOString().split('T')[0]
      });
      
      if (error) throw error;
      
      return this.safeParseJsonResponse(data);
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return {};
    }
  }

  /**
   * Get compliance metrics
   * Consolidates compliance tracking
   */
  static async getComplianceMetrics(teamId?: string): Promise<ComplianceMetrics> {
    try {
      // Simplified implementation - return placeholder metrics for now
      // TODO: Implement proper compliance tracking when backend functions are available
      return {
        overallCompliance: 85,
        certificationCompliance: 90,
        trainingCompliance: 80,
        documentationCompliance: 88
      };
    } catch (error) {
      console.error('Error fetching compliance metrics:', error);
      return {
        overallCompliance: 0,
        certificationCompliance: 0,
        trainingCompliance: 0,
        documentationCompliance: 0
      };
    }
  }

  /**
   * Search teams with filters
   * Implements unified search functionality
   */
  static async searchTeams(
    query: string,
    filters: {
      status?: string;
      location?: string;
      teamType?: string;
      userRole?: DatabaseUserRole;
      userId?: string;
    } = {}
  ): Promise<EnhancedTeam[]> {
    try {
      let queryBuilder = supabase
        .from('teams')
        .select(`
          *,
          locations(name, address)
        `);

      // Apply search query
      if (query) {
        queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
      }

      // Apply filters
      if (filters.status) {
        queryBuilder = queryBuilder.eq('status', filters.status);
      }

      if (filters.location) {
        queryBuilder = queryBuilder.eq('location_id', filters.location);
      }

      if (filters.teamType) {
        queryBuilder = queryBuilder.eq('team_type', filters.teamType);
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;

      return (data as unknown as EnhancedTeam[]) || [];
    } catch (error) {
      console.error('Error searching teams:', error);
      return [];
    }
  }

  /**
   * Utility method for safe JSON parsing
   * Handles various response formats from database functions
   */
  private static safeParseJsonResponse(data: any): any {
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return {};
      }
    }
    return data || {};
  }
}

// Export instance for compatibility with existing code
export const unifiedTeamService = new UnifiedTeamService();

// Export as default for easy importing
export default UnifiedTeamService;