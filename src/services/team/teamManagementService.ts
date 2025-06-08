
import { supabase } from '@/integrations/supabase/client';
import { teamAnalyticsService } from './teamAnalyticsService';
import { teamMemberService } from './teamMemberService';
import type { 
  Team, 
  EnhancedTeam, 
  TeamMember, 
  TeamMemberWithProfile,
  TeamLocationAssignment,
  TeamPerformanceMetrics,
  TeamAnalytics,
  CreateTeamRequest,
  Location,
  Provider,
  Profile
} from '@/types/team-management';

// Export the interfaces so they can be used by components
export type { 
  EnhancedTeam, 
  TeamLocationAssignment,
  TeamPerformanceMetrics,
  TeamAnalytics 
} from '@/types/team-management';

export class TeamManagementService {
  // Helper function to safely parse JSON
  private safeJsonParse<T>(value: any, defaultValue: T): T {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'object' && value !== null) return value as T;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }

  // Helper function to handle bigint conversion
  private convertBigIntToString(obj: any): any {
    if (typeof obj === 'bigint') {
      return obj.toString();
    } else if (Array.isArray(obj)) {
      return obj.map(item => this.convertBigIntToString(item));
    } else if (typeof obj === 'object' && obj !== null) {
      const newObj: { [key: string]: any } = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          newObj[key] = this.convertBigIntToString(obj[key]);
        }
      }
      return newObj;
    }
    return obj;
  }

  async createTeam(teamData: CreateTeamRequest): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .insert({
        name: teamData.name,
        description: teamData.description,
        team_type: teamData.team_type,
        location_id: teamData.location_id,
        provider_id: teamData.provider_id ? parseInt(teamData.provider_id, 10) : null,
        metadata: teamData.metadata || {},
        status: 'active',
        performance_score: 0.00,
        created_by: teamData.created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      provider_id: data.provider_id?.toString(),
      status: data.status as 'active' | 'inactive' | 'suspended',
      metadata: this.safeJsonParse(data.metadata, {}),
      monthly_targets: this.safeJsonParse(data.monthly_targets, {}),
      current_metrics: this.safeJsonParse(data.current_metrics, {})
    };
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({
        ...updates,
        provider_id: updates.provider_id ? parseInt(updates.provider_id, 10) : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      provider_id: data.provider_id?.toString(),
      status: data.status as 'active' | 'inactive' | 'suspended',
      metadata: this.safeJsonParse(data.metadata, {}),
      monthly_targets: this.safeJsonParse(data.monthly_targets, {}),
      current_metrics: this.safeJsonParse(data.current_metrics, {})
    };
  }

  async deleteTeam(teamId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (error) throw error;
  }

  async getAllEnhancedTeams(): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        locations (
          id, name, address, city, state, created_at, updated_at
        ),
        authorized_providers (
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
        ),
        team_members (
          id, team_id, user_id, role, status, location_assignment, 
          assignment_start_date, assignment_end_date, team_position, 
          permissions, created_at, updated_at,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        )
      `)
      .order('name');

    if (error) throw error;

    return (data || []).map(team => this.transformToEnhancedTeam(team));
  }

  // Alias for backward compatibility
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    return this.getAllEnhancedTeams();
  }

  // New method for getting all teams without full enhancement
  async getAllTeams(): Promise<Team[]> {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (error) throw error;
    
    return (data || []).map(team => ({
      ...team,
      provider_id: team.provider_id?.toString(),
      status: team.status as 'active' | 'inactive' | 'suspended',
      metadata: this.safeJsonParse(team.metadata, {}),
      monthly_targets: this.safeJsonParse(team.monthly_targets, {}),
      current_metrics: this.safeJsonParse(team.current_metrics, {})
    }));
  }

  async getTeamById(teamId: string): Promise<EnhancedTeam | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        locations (
          id, name, address, city, state, created_at, updated_at
        ),
        authorized_providers (
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
        ),
        team_members (
          id, team_id, user_id, role, status, location_assignment, 
          assignment_start_date, assignment_end_date, team_position, 
          permissions, created_at, updated_at,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        )
      `)
      .eq('id', teamId)
      .single();

    if (error) {
      console.error('Error fetching team by ID:', error);
      return null;
    }

    return this.transformToEnhancedTeam(data);
  }

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        locations (
          id, name, address, city, state, created_at, updated_at
        ),
        authorized_providers (
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
        ),
        team_members (
          id, team_id, user_id, role, status, location_assignment, 
          assignment_start_date, assignment_end_date, team_position, 
          permissions, created_at, updated_at,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        )
      `)
      .eq('location_id', locationId)
      .order('name');

    if (error) throw error;

    return (data || []).map(team => this.transformToEnhancedTeam(team));
  }

  async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    const providerIdNum = parseInt(providerId, 10);
    
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        locations (
          id, name, address, city, state, created_at, updated_at
        ),
        authorized_providers (
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at, description
        ),
        team_members (
          id, team_id, user_id, role, status, location_assignment, 
          assignment_start_date, assignment_end_date, team_position, 
          permissions, created_at, updated_at,
          profiles (
            id, display_name, email, role, created_at, updated_at
          )
        )
      `)
      .eq('provider_id', providerIdNum)
      .order('name');

    if (error) throw error;

    return (data || []).map(team => this.transformToEnhancedTeam(team));
  }

  // Use the analytics service for real data
  async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    return teamAnalyticsService.getTeamPerformanceMetrics(teamId);
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    // For now, return the team's primary location as an assignment
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        id,
        location_id,
        created_at,
        locations (id, name, created_at, updated_at)
      `)
      .eq('id', teamId)
      .single();

    if (error || !team || !team.location_id) return [];

    return [{
      id: `${team.id}-primary`,
      team_id: teamId,
      location_id: team.location_id,
      assignment_type: 'primary' as const,
      start_date: team.created_at,
      created_at: team.created_at,
      updated_at: team.created_at,
      location_name: team.locations?.name
    }];
  }

  async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    type: 'primary' | 'secondary' | 'temporary'
  ): Promise<TeamLocationAssignment> {
    // For now, update the team's location_id
    const { data, error } = await supabase
      .from('teams')
      .update({ 
        location_id: locationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: `${teamId}-${type}`,
      team_id: teamId,
      location_id: locationId,
      assignment_type: type,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // New method for creating team with location
  async createTeamWithLocation(teamData: CreateTeamRequest & { locationId?: string }): Promise<EnhancedTeam> {
    const team = await this.createTeam({
      ...teamData,
      location_id: teamData.locationId
    });

    // Fetch the enhanced team data
    const enhancedTeam = await this.getTeamById(team.id);
    
    if (!enhancedTeam) {
      throw new Error('Failed to create enhanced team');
    }

    return enhancedTeam;
  }

  // Use the analytics service for real system-wide data
  async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    return teamAnalyticsService.getSystemWideAnalytics();
  }

  // New team member management methods using the dedicated service
  async addTeamMember(
    teamId: string, 
    userId: string, 
    role: 'ADMIN' | 'MEMBER' = 'MEMBER'
  ): Promise<TeamMemberWithProfile> {
    return teamMemberService.addTeamMember(teamId, userId, role);
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    return teamMemberService.removeTeamMember(teamId, userId);
  }

  async updateMemberRole(teamId: string, userId: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    return teamMemberService.updateMemberRole(teamId, userId, newRole);
  }

  async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    return teamMemberService.getTeamMembers(teamId);
  }

  // Performance management methods
  async updateTeamPerformanceScore(teamId: string): Promise<number> {
    return teamAnalyticsService.calculateTeamPerformanceScore(teamId);
  }

  async bulkUpdatePerformanceScores(): Promise<{ teamId: string; score: number }[]> {
    const teams = await this.getAllTeams();
    const results = [];

    for (const team of teams) {
      try {
        const score = await this.updateTeamPerformanceScore(team.id);
        results.push({ teamId: team.id, score });
      } catch (error) {
        console.error(`Error updating performance for team ${team.id}:`, error);
      }
    }

    return results;
  }

  private transformToEnhancedTeam(rawTeam: any): EnhancedTeam {
    // Transform members
    const members: TeamMemberWithProfile[] = (rawTeam.team_members || []).map((member: any) => ({
      ...member,
      role: member.role as 'MEMBER' | 'ADMIN',
      status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
      permissions: this.safeJsonParse(member.permissions, {}),
      display_name: member.profiles?.display_name || member.user_id || 'Unknown',
      profiles: member.profiles ? {
        id: member.profiles.id,
        display_name: member.profiles.display_name,
        email: member.profiles.email,
        role: member.profiles.role,
        created_at: member.profiles.created_at,
        updated_at: member.profiles.updated_at
      } : undefined
    }));

    // Transform provider
    const provider: Provider | undefined = rawTeam.authorized_providers ? {
      id: rawTeam.authorized_providers.id?.toString(),
      name: rawTeam.authorized_providers.name,
      provider_type: rawTeam.authorized_providers.provider_type,
      status: rawTeam.authorized_providers.status,
      performance_rating: rawTeam.authorized_providers.performance_rating,
      compliance_score: rawTeam.authorized_providers.compliance_score,
      created_at: rawTeam.authorized_providers.created_at,
      updated_at: rawTeam.authorized_providers.updated_at,
      description: rawTeam.authorized_providers.description
    } : undefined;

    return {
      ...rawTeam,
      provider_id: rawTeam.provider_id?.toString(),
      status: rawTeam.status as 'active' | 'inactive' | 'suspended',
      metadata: this.safeJsonParse(rawTeam.metadata, {}),
      monthly_targets: this.safeJsonParse(rawTeam.monthly_targets, {}),
      current_metrics: this.safeJsonParse(rawTeam.current_metrics, {}),
      location: rawTeam.locations,
      provider,
      members
    };
  }
}

export const teamManagementService = new TeamManagementService();
