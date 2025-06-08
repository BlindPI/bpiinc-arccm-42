
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedTeam, 
  TeamMemberWithProfile, 
  MembershipStatistics,
  TeamAnalytics,
  WorkflowRequest
} from '@/types/team-management';

export class EnhancedTeamManagementService {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(*),
          authorized_providers(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id?.toString(),
        metadata: this.safeJsonParse(team.metadata, {}),
        monthly_targets: this.safeJsonParse(team.monthly_targets, {}),
        current_metrics: this.safeJsonParse(team.current_metrics, {}),
        location: team.locations,
        provider: team.authorized_providers,
        members: team.team_members?.map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || 'Unknown User',
          last_activity: member.last_activity || member.updated_at,
          profiles: member.profiles
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching enhanced teams:', error);
      return [];
    }
  }

  async getMembershipStatistics(teamId: string): Promise<MembershipStatistics> {
    try {
      const { data: members, error } = await supabase
        .from('team_members')
        .select('status, role, created_at')
        .eq('team_id', teamId);

      if (error) throw error;

      const totalMembers = members?.length || 0;
      const activeMembers = members?.filter(m => m.status === 'active').length || 0;
      const adminMembers = members?.filter(m => m.role === 'ADMIN').length || 0;
      
      // Recent joins (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentJoins = members?.filter(m => 
        new Date(m.created_at) > thirtyDaysAgo
      ).length || 0;

      // Members by status
      const membersByStatus = members?.reduce((acc, member) => {
        acc[member.status] = (acc[member.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        totalMembers,
        activeMembers,
        adminMembers,
        recentJoins,
        membersByStatus
      };
    } catch (error) {
      console.error('Error fetching membership statistics:', error);
      return {
        totalMembers: 0,
        activeMembers: 0,
        adminMembers: 0,
        recentJoins: 0,
        membersByStatus: {}
      };
    }
  }

  async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data: analytics, error } = await supabase.rpc('get_cross_team_analytics');
      
      if (error) throw error;

      const parsed = this.safeJsonParse(analytics, {});

      return {
        totalTeams: parsed.total_teams || 0,
        totalMembers: parsed.total_members || 0,
        averagePerformance: parsed.performance_average || 0,
        averageCompliance: parsed.compliance_score || 0,
        teamsByLocation: {},
        performanceByTeamType: {}
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

  // New methods for workflow management
  async getTeamWorkflows(teamId: string): Promise<WorkflowRequest[]> {
    try {
      const { data, error } = await supabase
        .from('team_workflows')
        .select(`
          *,
          teams(name),
          profiles(display_name)
        `)
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected',
        request_data: this.safeJsonParse(item.request_data, {}),
        approval_data: this.safeJsonParse(item.approval_data, {}),
        teams: item.teams,
        requester: item.profiles
      }));
    } catch (error) {
      console.error('Error fetching team workflows:', error);
      return [];
    }
  }

  async approveWorkflow(workflowId: string, approvedBy: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_workflows')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          completed_at: new Date().toISOString()
        })
        .eq('id', workflowId);

      if (error) throw error;
    } catch (error) {
      console.error('Error approving workflow:', error);
      throw error;
    }
  }

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
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
