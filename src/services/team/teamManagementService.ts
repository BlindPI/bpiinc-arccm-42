import { supabase } from '@/integrations/supabase/client';
import { EnhancedTeam, CreateTeamRequest, TeamAnalytics, TeamMemberWithProfile } from '@/types/team-management';

export class TeamManagementService {
  static async getProviderTeams(providerId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .eq('provider_id', providerId);
    
    if (error) throw error;
    return data || [];
  }

  static async getTeamById(teamId: string): Promise<EnhancedTeam | null> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .eq('id', teamId)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .eq('location_id', locationId);
    
    if (error) throw error;
    return data || [];
  }

  static async createTeam(teamData: CreateTeamRequest): Promise<EnhancedTeam> {
    const { data, error } = await supabase
      .from('teams')
      .insert(teamData)
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateTeamMember(memberId: string, updates: any) {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', memberId);
    
    if (error) throw error;
    return data;
  }

  static async removeTeamMember(memberId: string) {
    const { data, error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    
    if (error) throw error;
    return data;
  }

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        location:locations(*),
        provider:authorized_providers(*),
        team_members(
          id,
          user_id,
          role,
          status,
          profiles(id, display_name, email, role)
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return (data || []).map(team => ({
      ...team,
      member_count: team.team_members?.length || 0,
      members: team.team_members || []
    }));
  }

  static async getAllEnhancedTeams(): Promise<EnhancedTeam[]> {
    return this.getEnhancedTeams();
  }

  static async getAllTeams(): Promise<EnhancedTeam[]> {
    return this.getEnhancedTeams();
  }

  static async getSystemWideAnalytics(): Promise<TeamAnalytics> {
    const teams = await this.getEnhancedTeams();
    
    return {
      totalTeams: teams.length,
      totalMembers: teams.reduce((sum, team) => sum + (team.member_count || 0), 0),
      averagePerformance: teams.reduce((sum, team) => sum + (team.performance_score || 0), 0) / teams.length || 0,
      averageCompliance: 85, // Mock compliance score
      teamsByLocation: teams.reduce((acc, team) => {
        const locationName = team.location?.name || 'Unknown';
        acc[locationName] = (acc[locationName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      performanceByTeamType: teams.reduce((acc, team) => {
        acc[team.team_type] = (acc[team.team_type] || 0) + (team.performance_score || 0);
        return acc;
      }, {} as Record<string, number>)
    };
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    return this.getSystemWideAnalytics();
  }

  static async createTeamWithLocation(teamData: CreateTeamRequest & { locationId: string }): Promise<EnhancedTeam> {
    return this.createTeam({
      ...teamData,
      location_id: teamData.locationId
    });
  }

  static async getTeamLocationAssignments(teamId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles(id, display_name, email),
        teams(id, name, location_id)
      `)
      .eq('team_id', teamId);
    
    if (error) throw error;
    return data || [];
  }

  static async assignTeamToLocation(teamId: string, locationId: string): Promise<void> {
    const { error } = await supabase
      .from('teams')
      .update({ location_id: locationId })
      .eq('id', teamId);
    
    if (error) throw error;
  }

  static async getTeamPerformanceMetrics(teamId: string): Promise<any> {
    const team = await this.getTeamById(teamId);
    return {
      teamId,
      performanceScore: team?.performance_score || 0,
      memberCount: team?.member_count || 0,
      complianceScore: 85, // Mock data
      monthlyMetrics: {}
    };
  }

  static async addTeamMember(teamId: string, userId: string, role: string = 'MEMBER'): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .insert({
        team_id: teamId,
        user_id: userId,
        role: role as 'ADMIN' | 'MEMBER',
        status: 'active'
      });
    
    if (error) throw error;
  }

  static async updateMemberRole(memberId: string, role: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .update({ role: role as 'ADMIN' | 'MEMBER' })
      .eq('id', memberId);
    
    if (error) throw error;
  }

  static async updateTeamMemberRole(memberId: string, role: string): Promise<void> {
    return this.updateMemberRole(memberId, role);
  }

  static async removeMember(memberId: string): Promise<void> {
    return this.removeTeamMember(memberId);
  }
}

// Export instance for backwards compatibility
export const teamManagementService = TeamManagementService;
