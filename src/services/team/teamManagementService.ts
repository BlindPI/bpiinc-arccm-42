import { supabase } from '@/integrations/supabase/client';
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

export class TeamManagementService {
  // Helper function to safely parse JSON
  private safeJsonParse<T>(str: string, defaultValue: T): T {
    try {
      return JSON.parse(str) as T;
    } catch (e) {
      return defaultValue;
    }
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
        provider_id: teamData.provider_id,
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
    return data as Team;
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const { data, error } = await supabase
      .from('teams')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', teamId)
      .select()
      .single();

    if (error) throw error;
    return data as Team;
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
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at
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

  async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        locations (
          id, name, address, city, state, created_at, updated_at
        ),
        authorized_providers (
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at
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
          id, name, provider_type, status, performance_rating, compliance_score, created_at, updated_at
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

  async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    // Get team with location info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        performance_score,
        locations (name)
      `)
      .eq('id', teamId)
      .single();

    if (teamError || !team) return null;

    // Get certificate count for team location
    const { data: certificates } = await supabase
      .from('certificates')
      .select('id')
      .eq('location_id', team.locations?.id);

    // Get course count for team location
    const { data: courses } = await supabase
      .from('course_offerings')
      .select('id')
      .eq('location_id', team.locations?.id);

    return {
      team_id: teamId,
      location_name: team.locations?.name,
      totalCertificates: certificates?.length || 0,
      totalCourses: courses?.length || 0,
      averageSatisfaction: 85.0, // Mock data
      complianceScore: team.performance_score || 0,
      performanceTrend: team.performance_score || 0,
      total_certificates: certificates?.length || 0,
      total_courses: courses?.length || 0,
      avg_satisfaction: 85.0,
      compliance_score: team.performance_score || 0,
      performance_trend: team.performance_score || 0
    };
  }

  async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    // For now, return the team's primary location as an assignment
    const { data: team, error } = await supabase
      .from('teams')
      .select(`
        id,
        location_id,
        created_at,
        locations (name)
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

  private transformToEnhancedTeam(rawTeam: any): EnhancedTeam {
    // Safe metadata parsing
    let metadata: Record<string, any> = {};
    if (rawTeam.metadata) {
      if (typeof rawTeam.metadata === 'object' && rawTeam.metadata !== null) {
        metadata = rawTeam.metadata as Record<string, any>;
      } else if (typeof rawTeam.metadata === 'string') {
        try {
          metadata = JSON.parse(rawTeam.metadata);
        } catch {
          metadata = {};
        }
      }
    }

    // Transform members
    const members: TeamMemberWithProfile[] = (rawTeam.team_members || []).map((member: any) => ({
      id: member.id,
      team_id: member.team_id,
      user_id: member.user_id,
      role: member.role as 'MEMBER' | 'ADMIN',
      status: member.status as 'active' | 'inactive' | 'on_leave' | 'suspended',
      location_assignment: member.location_assignment,
      assignment_start_date: member.assignment_start_date,
      assignment_end_date: member.assignment_end_date,
      team_position: member.team_position,
      permissions: member.permissions || {},
      created_at: member.created_at,
      updated_at: member.updated_at,
      display_name: member.profiles?.display_name || 'Unknown',
      profiles: member.profiles ? {
        id: member.profiles.id,
        display_name: member.profiles.display_name,
        email: member.profiles.email,
        role: member.profiles.role,
        created_at: member.profiles.created_at,
        updated_at: member.profiles.updated_at
      } : undefined
    }));

    return {
      id: rawTeam.id,
      name: rawTeam.name,
      description: rawTeam.description,
      team_type: rawTeam.team_type,
      status: rawTeam.status as 'active' | 'inactive' | 'suspended',
      performance_score: rawTeam.performance_score || 0,
      location_id: rawTeam.location_id,
      provider_id: rawTeam.provider_id,
      created_by: rawTeam.created_by,
      created_at: rawTeam.created_at,
      updated_at: rawTeam.updated_at,
      metadata,
      monthly_targets: rawTeam.monthly_targets || {},
      current_metrics: rawTeam.current_metrics || {},
      location: rawTeam.locations ? {
        id: rawTeam.locations.id,
        name: rawTeam.locations.name,
        address: rawTeam.locations.address,
        city: rawTeam.locations.city,
        state: rawTeam.locations.state,
        created_at: rawTeam.locations.created_at,
        updated_at: rawTeam.locations.updated_at
      } : undefined,
      provider: rawTeam.authorized_providers ? {
        id: rawTeam.authorized_providers.id,
        name: rawTeam.authorized_providers.name,
        provider_type: rawTeam.authorized_providers.provider_type,
        status: rawTeam.authorized_providers.status,
        performance_rating: rawTeam.authorized_providers.performance_rating,
        compliance_score: rawTeam.authorized_providers.compliance_score,
        created_at: rawTeam.authorized_providers.created_at,
        updated_at: rawTeam.authorized_providers.updated_at
      } : undefined,
      members
    };
  }
}

export const teamManagementService = new TeamManagementService();
