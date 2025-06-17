// Unified Provider Service - Enterprise Grade Implementation
// Phase 3: Service Layer Fixes with TypeScript Error Resolution
// Comprehensive provider management with fallback methods

import { supabase } from '@/integrations/supabase/client';
import {
  AuthorizedProvider,
  Team,
  TeamMember,
  TeamMemberWithProfile,
  ProviderTeamAssignment,
  ProviderTeamAssignmentDetailed,
  ProviderWithRelationships,
  ProviderPerformanceMetrics,
  Location,
  CreateProviderRequest,
  UpdateProviderRequest,
  AssignProviderToTeamRequest,
  AddTeamMemberRequest,
  ProviderFilters,
  TeamFilters,
  ApiResponse,
  PaginatedResponse
} from '@/types/provider-management';

/**
 * Unified Provider Service - Enterprise Grade
 * Handles all provider management operations with comprehensive error handling
 * and fallback methods for maximum reliability
 */
export class UnifiedProviderService {
  
  // =============================================================================
  // Provider Management Methods
  // =============================================================================

  /**
   * Get provider with all relationships using fallback method
   * Handles type conversions properly
   */
  static async getProviderWithRelationships(providerId: string): Promise<ApiResponse<ProviderWithRelationships | null>> {
    try {
      // Get provider data
      const { data: provider, error: providerError } = await supabase
        .from('authorized_providers')
        .select('*')
        .eq('id', providerId)
        .single();

      if (providerError || !provider) {
        return { data: null, error: 'Provider not found' };
      }

      // Get location data
      const { data: location } = await supabase
        .from('locations')
        .select('*')
        .eq('id', provider.primary_location_id || '')
        .single();

      // Get teams data - handle provider_id type conversion
      const { data: teams } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          team_type,
          status,
          location_id,
          provider_id,
          performance_score,
          monthly_targets,
          current_metrics,
          created_at,
          updated_at
        `)
        .eq('provider_id', parseInt(providerId) || 0);

      // Calculate performance metrics
      const performance_metrics: ProviderPerformanceMetrics = {
        certificates_issued: 0,
        courses_conducted: 0,
        total_members: 0,
        active_assignments: teams?.length || 0
      };

      // Convert teams data to proper format
      const convertedTeams: Team[] = (teams || []).map(team => ({
        id: team.id,
        name: team.name,
        team_type: team.team_type,
        status: team.status,
        location_id: team.location_id,
        provider_id: team.provider_id?.toString() || providerId,
        performance_score: team.performance_score,
        monthly_targets: team.monthly_targets as Record<string, any>,
        current_metrics: team.current_metrics as Record<string, any>,
        created_at: team.created_at,
        updated_at: team.updated_at
      }));

      return {
        data: {
          provider_data: provider as AuthorizedProvider,
          location_data: location as Location,
          teams_data: convertedTeams,
          performance_metrics
        }
      };

    } catch (error) {
      console.error('Error in getProviderWithRelationships:', error);
      return { data: null, error: 'Failed to fetch provider data' };
    }
  }

  /**
   * Get teams with filters and pagination
   */
  static async getTeams(filters?: TeamFilters, page = 1, limit = 10): Promise<PaginatedResponse<Team>> {
    try {
      let query = supabase
        .from('teams')
        .select(`
          id,
          name,
          team_type,
          status,
          location_id,
          provider_id,
          performance_score,
          monthly_targets,
          current_metrics,
          created_at,
          updated_at
        `, { count: 'exact' });

      // Apply filters
      if (filters) {
        if (filters.status && filters.status.length > 0) {
          query = query.in('status', filters.status);
        }
        if (filters.team_type && filters.team_type.length > 0) {
          query = query.in('team_type', filters.team_type);
        }
        if (filters.location_id) {
          query = query.eq('location_id', filters.location_id);
        }
        if (filters.provider_id) {
          // Convert string to number for database query
          const providerIdNum = parseInt(filters.provider_id);
          if (!isNaN(providerIdNum)) {
            query = query.eq('provider_id', providerIdNum);
          }
        }
        if (filters.search) {
          query = query.ilike('name', `%${filters.search}%`);
        }
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Convert provider_id from number to string for consistency
      const convertedData: Team[] = (data || []).map(team => ({
        id: team.id,
        name: team.name,
        team_type: team.team_type,
        status: team.status,
        location_id: team.location_id,
        provider_id: team.provider_id?.toString(),
        performance_score: team.performance_score,
        monthly_targets: team.monthly_targets as Record<string, any>,
        current_metrics: team.current_metrics as Record<string, any>,
        created_at: team.created_at,
        updated_at: team.updated_at
      }));

      return {
        data: convertedData,
        count: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit)
      };

    } catch (error) {
      console.error('Error getting teams:', error);
      return {
        data: [],
        count: 0,
        page,
        limit,
        total_pages: 0
      };
    }
  }

  /**
   * Get provider team assignments with detailed information
   */
  static async getProviderAssignments(providerId: string): Promise<ProviderTeamAssignmentDetailed[]> {
    try {
      // Convert providerId to number for database query
      const providerIdNum = parseInt(providerId);
      if (isNaN(providerIdNum)) {
        console.error('Invalid provider ID:', providerId);
        return [];
      }

      const { data: assignments, error } = await supabase
        .from('provider_team_assignments')
        .select(`
          id,
          provider_id,
          team_id,
          assignment_role,
          oversight_level,
          status,
          assigned_by,
          assigned_at,
          created_at,
          updated_at,
          team:teams(
            id,
            name,
            team_type,
            status,
            performance_score,
            location:locations(name)
          )
        `)
        .eq('provider_id', providerIdNum);

      if (error || !assignments) {
        console.error('Error fetching assignments:', error);
        return [];
      }

      return assignments.map((assignment: any) => ({
        id: assignment.id,
        provider_id: providerId, // Keep as string for consistency
        team_id: assignment.team_id,
        assignment_role: assignment.assignment_role,
        oversight_level: assignment.oversight_level,
        assignment_type: 'ongoing' as const,
        start_date: assignment.created_at,
        status: assignment.status,
        assigned_by: assignment.assigned_by,
        assigned_at: assignment.assigned_at || assignment.created_at,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at,
        team_name: assignment.team?.name || 'Unknown Team',
        team_type: assignment.team?.team_type || 'unknown',
        team_status: assignment.team?.status || 'unknown',
        location_name: assignment.team?.location?.name || 'Unknown Location',
        member_count: 0,
        performance_score: assignment.team?.performance_score || 0
      })) as ProviderTeamAssignmentDetailed[];

    } catch (error) {
      console.error('Error in getProviderAssignments:', error);
      return [];
    }
  }

  // =============================================================================
  // Team Member Management Methods
  // =============================================================================

  /**
   * Add team member using direct database operations
   */
  static async addTeamMember(request: AddTeamMemberRequest): Promise<ApiResponse<TeamMemberWithProfile | null>> {
    try {
      const { team_id: teamId, user_id: userId, role = 'member' } = request;

      // Check if member already exists
      const existingMember = await this.getTeamMember(teamId, userId);
      if (existingMember) {
        return {
          data: existingMember,
          message: 'User is already a team member'
        };
      }

      // Insert new team member
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Get the complete member data
      const member = await this.getTeamMember(teamId, userId);
      return {
        data: member,
        message: 'Team member added successfully'
      };

    } catch (error) {
      console.error('Error in addTeamMember:', error);
      return {
        data: null,
        error: `Failed to add team member: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get team member by team ID and user ID
   */
  static async getTeamMember(teamId: string, userId: string): Promise<TeamMemberWithProfile | null> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          team_id,
          user_id,
          role,
          status,
          location_assignment,
          assignment_start_date,
          assignment_end_date,
          team_position,
          permissions,
          last_activity,
          created_at,
          updated_at
        `)
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      // Get user profile data separately
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', userId)
        .single();

      return {
        ...data,
        display_name: profile?.display_name || 'Unknown User',
        email: profile?.email,
        user_role: undefined
      } as TeamMemberWithProfile;

    } catch (error) {
      console.error('Error getting team member:', error);
      return null;
    }
  }

  // =============================================================================
  // Provider-Team Assignment Methods
  // =============================================================================

  /**
   * Assign provider to team using direct database operations
   */
  static async assignProviderToTeam(request: AssignProviderToTeamRequest): Promise<ApiResponse<ProviderTeamAssignment | null>> {
    try {
      const {
        provider_id: providerId,
        team_id: teamId,
        assignment_role = 'primary',
        oversight_level = 'standard',
        assignment_type = 'ongoing',
        end_date
      } = request;

      // Convert providerId to number for database operations
      const providerIdNum = parseInt(providerId);
      if (isNaN(providerIdNum)) {
        return {
          data: null,
          error: 'Invalid provider ID format'
        };
      }

      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('provider_team_assignments')
        .select('id')
        .eq('provider_id', providerIdNum)
        .eq('team_id', teamId)
        .eq('status', 'active')
        .single();

      if (existing) {
        const assignment = await this.getProviderTeamAssignment(existing.id);
        return {
          data: assignment,
          message: 'Provider is already assigned to this team'
        };
      }

      // Create new assignment
      const { data, error } = await supabase
        .from('provider_team_assignments')
        .insert({
          provider_id: providerIdNum,
          team_id: teamId,
          assignment_role,
          oversight_level,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update team's provider_id for primary assignments
      if (assignment_role === 'primary') {
        await supabase
          .from('teams')
          .update({ provider_id: providerIdNum })
          .eq('id', teamId);
      }

      // Get the complete assignment data
      const assignment = await this.getProviderTeamAssignment(data.id);
      return {
        data: assignment,
        message: 'Provider assigned to team successfully'
      };

    } catch (error) {
      console.error('Error in assignProviderToTeam:', error);
      return {
        data: null,
        error: `Failed to assign provider: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get provider team assignment by ID
   */
  static async getProviderTeamAssignment(assignmentId: string): Promise<ProviderTeamAssignment | null> {
    try {
      const { data, error } = await supabase
        .from('provider_team_assignments')
        .select(`
          id,
          provider_id,
          team_id,
          assignment_role,
          oversight_level,
          status,
          assigned_by,
          assigned_at,
          created_at,
          updated_at
        `)
        .eq('id', assignmentId)
        .single();

      if (error || !data) return null;

      // Convert provider_id to string for consistency
      return {
        id: data.id,
        provider_id: data.provider_id?.toString() || '',
        team_id: data.team_id,
        assignment_role: data.assignment_role,
        oversight_level: data.oversight_level,
        assignment_type: 'ongoing' as const,
        start_date: data.created_at,
        status: data.status,
        assigned_by: data.assigned_by,
        assigned_at: data.assigned_at || data.created_at,
        created_at: data.created_at,
        updated_at: data.updated_at
      } as ProviderTeamAssignment;

    } catch (error) {
      console.error('Error getting provider team assignment:', error);
      return null;
    }
  }

  // =============================================================================
  // Analytics and Performance Methods
  // =============================================================================

  /**
   * Get provider performance analytics
   */
  static async getProviderAnalytics(providerId: string): Promise<ApiResponse<any>> {
    try {
      const assignments = await this.getProviderAssignments(providerId);
      
      const analytics = {
        total_assignments: assignments.length,
        active_assignments: assignments.filter(a => a.status === 'active').length,
        teams_managed: assignments.filter(a => a.assignment_role === 'primary').length,
        average_performance: assignments.length > 0 
          ? assignments.reduce((sum, a) => sum + a.performance_score, 0) / assignments.length 
          : 0,
        assignment_distribution: {
          primary: assignments.filter(a => a.assignment_role === 'primary').length,
          secondary: assignments.filter(a => a.assignment_role === 'secondary').length,
          supervisor: assignments.filter(a => a.assignment_role === 'supervisor').length,
          coordinator: assignments.filter(a => a.assignment_role === 'coordinator').length
        }
      };

      return { data: analytics };

    } catch (error) {
      console.error('Error getting provider analytics:', error);
      return { data: null, error: 'Failed to get analytics' };
    }
  }
}

// =============================================================================
// Backward Compatibility Exports
// =============================================================================

// Export the service class as default
export default UnifiedProviderService;

// Export individual methods for backward compatibility
export const getProviderWithRelationships = UnifiedProviderService.getProviderWithRelationships.bind(UnifiedProviderService);
export const getTeams = UnifiedProviderService.getTeams.bind(UnifiedProviderService);
export const getProviderAssignments = UnifiedProviderService.getProviderAssignments.bind(UnifiedProviderService);
export const addTeamMember = UnifiedProviderService.addTeamMember.bind(UnifiedProviderService);
export const assignProviderToTeam = UnifiedProviderService.assignProviderToTeam.bind(UnifiedProviderService);
export const getProviderAnalytics = UnifiedProviderService.getProviderAnalytics.bind(UnifiedProviderService);

// Fix naming inconsistency - export as both names for compatibility
export { UnifiedProviderService as TeamAnalyticsService };
export const teamAnalyticsService = UnifiedProviderService;