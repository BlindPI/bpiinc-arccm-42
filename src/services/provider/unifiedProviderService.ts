// Unified Provider Service
// Phase 3: Service Layer Fixes
// Fixes all service import/export inconsistencies and ID type issues

import { supabase } from '@/integrations/supabase/client';
import type {
  AuthorizedProvider,
  Team,
  TeamMember,
  TeamMemberWithProfile,
  ProviderTeamAssignment,
  ProviderTeamAssignmentDetailed,
  ProviderWithRelationships,
  ProviderPerformanceMetrics,
  CreateProviderRequest,
  UpdateProviderRequest,
  AssignProviderToTeamRequest,
  AddTeamMemberRequest,
  ApiResponse,
  PaginatedResponse,
  ProviderFilters,
  TeamFilters
} from '@/types/provider-management';

// =============================================================================
// Unified Provider Service Class
// =============================================================================

export class UnifiedProviderService {
  
  // =========================================================================
  // Provider Management Methods
  // =========================================================================

  /**
   * Get provider with all related data (fixes ID type consistency)
   */
  static async getProviderWithRelationships(providerId: string): Promise<ProviderWithRelationships> {
    const { data, error } = await supabase.rpc('get_provider_with_relationships', {
      p_provider_id: providerId // UUID string
    });
    
    if (error) {
      console.error('Error fetching provider relationships:', error);
      throw new Error(`Failed to fetch provider relationships: ${error.message}`);
    }
    
    return data[0] || null;
  }

  /**
   * Get all authorized providers with optional filtering
   */
  static async getAuthorizedProviders(
    filters?: ProviderFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<AuthorizedProvider>> {
    let query = supabase
      .from('authorized_providers')
      .select(`
        *,
        primary_location:locations(id, name, city, state),
        teams:provider_team_assignments(
          assignment_role,
          team:teams(id, name, team_type, status)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.provider_type?.length) {
      query = query.in('provider_type', filters.provider_type);
    }
    if (filters?.location_id) {
      query = query.eq('primary_location_id', filters.location_id);
    }
    if (filters?.performance_rating_min) {
      query = query.gte('performance_rating', filters.performance_rating_min);
    }
    if (filters?.compliance_score_min) {
      query = query.gte('compliance_score', filters.compliance_score_min);
    }
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching authorized providers:', error);
      throw new Error(`Failed to fetch authorized providers: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * Create a new authorized provider
   */
  static async createProvider(providerData: CreateProviderRequest): Promise<AuthorizedProvider> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .insert([{
        ...providerData,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating provider:', error);
      throw new Error(`Failed to create provider: ${error.message}`);
    }

    return data;
  }

  /**
   * Update an existing provider
   */
  static async updateProvider(providerData: UpdateProviderRequest): Promise<AuthorizedProvider> {
    const { id, ...updateData } = providerData;
    
    const { data, error } = await supabase
      .from('authorized_providers')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating provider:', error);
      throw new Error(`Failed to update provider: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a provider
   */
  static async deleteProvider(providerId: string): Promise<void> {
    const { error } = await supabase
      .from('authorized_providers')
      .delete()
      .eq('id', providerId);

    if (error) {
      console.error('Error deleting provider:', error);
      throw new Error(`Failed to delete provider: ${error.message}`);
    }
  }

  // =========================================================================
  // Team Management Methods
  // =========================================================================

  /**
   * Get teams with optional filtering
   */
  static async getTeams(
    filters?: TeamFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedResponse<Team>> {
    let query = supabase
      .from('teams')
      .select(`
        *,
        location:locations(id, name, city, state),
        provider:authorized_providers(id, name, provider_type),
        members:team_members(
          id, user_id, role, status,
          profile:profiles(id, display_name, email)
        )
      `, { count: 'exact' });

    // Apply filters
    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters?.team_type?.length) {
      query = query.in('team_type', filters.team_type);
    }
    if (filters?.location_id) {
      query = query.eq('location_id', filters.location_id);
    }
    if (filters?.provider_id) {
      query = query.eq('provider_id', filters.provider_id);
    }
    if (filters?.performance_score_min) {
      query = query.gte('performance_score', filters.performance_score_min);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching teams:', error);
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit)
    };
  }

  /**
   * Get detailed teams for a specific provider
   */
  static async getProviderTeams(providerId: string): Promise<ProviderTeamAssignmentDetailed[]> {
    const { data, error } = await supabase.rpc('get_provider_teams_detailed', {
      p_provider_id: providerId
    });

    if (error) {
      console.error('Error fetching provider teams:', error);
      throw new Error(`Failed to fetch provider teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Safe team member addition with validation
   */
  static async addTeamMember(request: AddTeamMemberRequest): Promise<string> {
    const { data, error } = await supabase.rpc('add_team_member_safe', {
      p_team_id: request.team_id,
      p_user_id: request.user_id,
      p_role: request.role || 'MEMBER'
    });

    if (error) {
      console.error('Error adding team member:', error);
      throw new Error(`Failed to add team member: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove team member
   */
  static async removeTeamMember(teamId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ status: 'inactive' })
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing team member:', error);
      throw new Error(`Failed to remove team member: ${error.message}`);
    }
  }

  /**
   * Get team members with profiles
   */
  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profile:profiles(id, display_name, email, role)
      `)
      .eq('team_id', teamId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching team members:', error);
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    return (data || []).map(member => ({
      ...member,
      display_name: member.profile?.display_name || 'Unknown User',
      email: member.profile?.email,
      user_role: member.profile?.role
    }));
  }

  // =========================================================================
  // Provider-Team Assignment Methods
  // =========================================================================

  /**
   * Assign provider to team with validation
   */
  static async assignProviderToTeam(request: AssignProviderToTeamRequest): Promise<string> {
    const { data, error } = await supabase.rpc('assign_provider_to_team_safe', {
      p_provider_id: request.provider_id,
      p_team_id: request.team_id,
      p_assignment_role: request.assignment_role || 'primary',
      p_oversight_level: request.oversight_level || 'standard',
      p_assignment_type: request.assignment_type || 'ongoing',
      p_end_date: request.end_date || null
    });

    if (error) {
      console.error('Error assigning provider to team:', error);
      throw new Error(`Failed to assign provider to team: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove provider assignment from team
   */
  static async removeProviderAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('provider_team_assignments')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId);

    if (error) {
      console.error('Error removing provider assignment:', error);
      throw new Error(`Failed to remove provider assignment: ${error.message}`);
    }
  }

  /**
   * Get all provider assignments
   */
  static async getProviderAssignments(providerId: string): Promise<ProviderTeamAssignment[]> {
    const { data, error } = await supabase
      .from('provider_team_assignments')
      .select(`
        *,
        provider:authorized_providers(id, name, provider_type),
        team:teams(id, name, team_type, status, location:locations(name))
      `)
      .eq('provider_id', providerId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching provider assignments:', error);
      throw new Error(`Failed to fetch provider assignments: ${error.message}`);
    }

    return data || [];
  }

  // =========================================================================
  // Analytics and Performance Methods
  // =========================================================================

  /**
   * Get provider performance metrics
   */
  static async getProviderPerformanceMetrics(providerId: string): Promise<ProviderPerformanceMetrics> {
    // This would typically aggregate data from multiple sources
    const { data, error } = await supabase.rpc('get_provider_with_relationships', {
      p_provider_id: providerId
    });

    if (error) {
      console.error('Error fetching provider metrics:', error);
      throw new Error(`Failed to fetch provider metrics: ${error.message}`);
    }

    return data[0]?.performance_metrics || {
      certificates_issued: 0,
      courses_conducted: 0,
      total_members: 0,
      active_assignments: 0
    };
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Search providers by name or description
   */
  static async searchProviders(searchTerm: string, limit: number = 10): Promise<AuthorizedProvider[]> {
    const { data, error } = await supabase
      .from('authorized_providers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .eq('status', 'active')
      .limit(limit);

    if (error) {
      console.error('Error searching providers:', error);
      throw new Error(`Failed to search providers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get provider statistics
   */
  static async getProviderStatistics(): Promise<{
    total_providers: number;
    active_providers: number;
    total_assignments: number;
    active_assignments: number;
  }> {
    const [providersResult, assignmentsResult] = await Promise.all([
      supabase
        .from('authorized_providers')
        .select('status', { count: 'exact' }),
      supabase
        .from('provider_team_assignments')
        .select('status', { count: 'exact' })
    ]);

    if (providersResult.error || assignmentsResult.error) {
      throw new Error('Failed to fetch provider statistics');
    }

    const activeProviders = await supabase
      .from('authorized_providers')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    const activeAssignments = await supabase
      .from('provider_team_assignments')
      .select('*', { count: 'exact' })
      .eq('status', 'active');

    return {
      total_providers: providersResult.count || 0,
      active_providers: activeProviders.count || 0,
      total_assignments: assignmentsResult.count || 0,
      active_assignments: activeAssignments.count || 0
    };
  }
}

// =============================================================================
// Default Export
// =============================================================================

export default UnifiedProviderService;

// =============================================================================
// Named Exports for Backward Compatibility
// =============================================================================

export const ProviderService = UnifiedProviderService;
export const TeamManagementService = UnifiedProviderService;
export const ProviderTeamService = UnifiedProviderService;

// Fix for teamAnalyticsService vs TeamAnalyticsService naming inconsistency
export const teamAnalyticsService = {
  getProviderPerformanceMetrics: UnifiedProviderService.getProviderPerformanceMetrics,
  getProviderStatistics: UnifiedProviderService.getProviderStatistics
};

export const TeamAnalyticsService = teamAnalyticsService;