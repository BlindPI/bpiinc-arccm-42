
import { supabase } from '@/integrations/supabase/client';
import type { 
  Team, 
  TeamMemberWithProfile, 
  CreateTeamRequest, 
  TeamLocationAssignment,
  EnhancedTeam,
  TeamAnalytics,
  SystemWideAnalytics,
  TeamPerformanceMetrics
} from '@/types/team-management';

export class TeamManagementService {
  // Core team operations
  static async getAllTeams(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all teams:', error);
      return [];
    }
  }

  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      if (error) throw error;
      
      return (data || []).map((item: any) => {
        const teamData = item.team_data;
        return {
          ...teamData,
          created_by: teamData.created_by || '',
          current_metrics: teamData.current_metrics || {},
          monthly_targets: teamData.monthly_targets || {},
          metadata: teamData.metadata || {}
        };
      });
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  static async getAllEnhancedTeams(): Promise<EnhancedTeam[]> {
    return this.getEnhancedTeams();
  }

  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profile:user_id (
            id,
            display_name,
            email,
            role
          )
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(member => ({
        id: member.id,
        team_id: member.team_id,
        user_id: member.user_id,
        role: member.role as 'ADMIN' | 'MEMBER',
        joined_at: member.created_at,
        status: member.status as 'active' | 'inactive',
        permissions: Array.isArray(member.permissions) ? member.permissions : [],
        created_at: member.created_at,
        updated_at: member.updated_at,
        last_activity: member.last_activity || member.updated_at,
        display_name: member.profile?.display_name,
        location_assignment: member.location_assignment,
        assignment_start_date: member.assignment_start_date,
        assignment_end_date: member.assignment_end_date,
        team_position: member.team_position,
        profile: member.profile ? {
          id: member.profile.id,
          display_name: member.profile.display_name,
          email: member.profile.email,
          role: member.profile.role
        } : undefined
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  static async addTeamMember(teamId: string, userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role: role,
          status: 'active',
          permissions: role === 'ADMIN' ? ['manage_members', 'edit_settings'] : ['view_team']
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding team member:', error);
      throw error;
    }
  }

  static async updateMemberRole(memberId: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ 
          role: newRole,
          permissions: newRole === 'ADMIN' ? ['manage_members', 'edit_settings'] : ['view_team']
        })
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  }

  static async updateTeamMemberRole(teamId: string, memberId: string, newRole: 'ADMIN' | 'MEMBER'): Promise<void> {
    return this.updateMemberRole(memberId, newRole);
  }

  static async removeMember(memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
  }

  static async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    return this.removeMember(memberId);
  }

  static async createTeam(teamData: CreateTeamRequest): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert(teamData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  }

  static async createTeamWithLocation(teamData: CreateTeamRequest & { location_id: string }): Promise<Team | null> {
    return this.createTeam(teamData);
  }

  static async getTeamLocationAssignments(teamId: string): Promise<TeamLocationAssignment[]> {
    try {
      const { data, error } = await supabase
        .from('team_location_assignments')
        .select(`
          *,
          location:location_id (
            id,
            name,
            city,
            state
          )
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (error) throw error;
      return (data || []).map(assignment => ({
        ...assignment,
        location_name: assignment.location?.name
      }));
    } catch (error) {
      console.error('Error fetching team location assignments:', error);
      return [];
    }
  }

  static async assignTeamToLocation(
    teamId: string, 
    locationId: string, 
    assignmentType: 'primary' | 'secondary' | 'coverage' = 'primary'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_location_assignments')
        .insert({
          team_id: teamId,
          location_id: locationId,
          assignment_type: assignmentType,
          is_active: true,
          assigned_at: new Date().toISOString(),
          start_date: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error assigning team to location:', error);
      throw error;
    }
  }

  static async getProviderTeams(providerId: string | number): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching provider teams:', error);
      return [];
    }
  }

  static async getTeamsByLocation(locationId: string): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          location:location_id (*),
          provider:provider_id (*),
          members:team_members (
            *,
            profile:user_id (*)
          )
        `)
        .eq('location_id', locationId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(team => ({
        ...team,
        created_by: team.created_by || '',
        current_metrics: {},
        monthly_targets: {},
        metadata: {}
      }));
    } catch (error) {
      console.error('Error fetching teams by location:', error);
      return [];
    }
  }

  static async getSystemWideAnalytics(): Promise<SystemWideAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      
      return {
        overview: {
          totalTeams: data?.total_teams || 0,
          totalMembers: data?.total_members || 0,
          activeProjects: 0,
          systemHealth: 95
        },
        performance: {
          averageTeamPerformance: data?.performance_average || 0,
          topPerformers: [],
          bottomPerformers: []
        },
        compliance: {
          compliantTeams: 0,
          nonCompliantTeams: 0,
          pendingReviews: 0
        },
        trends: {
          monthlyGrowth: 5.2,
          performanceTrend: 2.1,
          membershipTrend: 8.7
        },
        totalTeams: data?.total_teams || 0,
        totalMembers: data?.total_members || 0,
        averagePerformance: data?.performance_average || 0,
        averageCompliance: data?.compliance_score || 85,
        teamsByProvider: data?.teamsByProvider || {}
      };
    } catch (error) {
      console.error('Error fetching system analytics:', error);
      return {
        overview: { totalTeams: 0, totalMembers: 0, activeProjects: 0, systemHealth: 0 },
        performance: { averageTeamPerformance: 0, topPerformers: [], bottomPerformers: [] },
        compliance: { compliantTeams: 0, nonCompliantTeams: 0, pendingReviews: 0 },
        trends: { monthlyGrowth: 0, performanceTrend: 0, membershipTrend: 0 },
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByProvider: {}
      };
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      if (error) throw error;
      
      return {
        totalTeams: data?.total_teams || 0,
        activeTeams: data?.active_teams || 0,
        totalMembers: data?.total_members || 0,
        averageTeamSize: data?.average_team_size || 0,
        teamsByType: data?.teams_by_type || {},
        performanceMetrics: {
          averagePerformanceScore: data?.performance_average || 0,
          topPerformingTeams: data?.top_performing_teams || []
        },
        complianceMetrics: {
          compliantTeams: data?.compliant_teams || 0,
          pendingReviews: data?.pending_reviews || 0,
          overdueTasks: data?.overdue_tasks || 0
        },
        averagePerformance: data?.performance_average || 0,
        averageCompliance: data?.compliance_score || 0,
        teamsByLocation: data?.teams_by_location || {},
        performanceByTeamType: data?.performance_by_team_type || {},
        teamsByProvider: data?.teams_by_provider || {}
      };
    } catch (error) {
      console.error('Error fetching team analytics:', error);
      return {
        totalTeams: 0,
        activeTeams: 0,
        totalMembers: 0,
        averageTeamSize: 0,
        teamsByType: {},
        performanceMetrics: { averagePerformanceScore: 0, topPerformingTeams: [] },
        complianceMetrics: { compliantTeams: 0, pendingReviews: 0, overdueTasks: 0 },
        averagePerformance: 0,
        averageCompliance: 0,
        teamsByLocation: {},
        performanceByTeamType: {},
        teamsByProvider: {}
      };
    }
  }

  static async getTeamPerformanceMetrics(teamId: string): Promise<TeamPerformanceMetrics | null> {
    try {
      const { data, error } = await supabase
        .from('team_performance_metrics')
        .select('*')
        .eq('team_id', teamId)
        .order('metric_period_start', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return {
        ...data,
        team_name: data.team_name || 'Unknown Team',
        averageSatisfaction: data.average_satisfaction_score || 0,
        complianceScore: data.compliance_score || 0,
        location_name: data.location_name || '',
        performance_trend: 0
      };
    } catch (error) {
      console.error('Error fetching team performance metrics:', error);
      return null;
    }
  }
}

export const teamManagementService = TeamManagementService;
