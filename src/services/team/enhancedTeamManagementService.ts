
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedTeam, 
  TeamMemberWithProfile, 
  MembershipStatistics,
  TeamAnalytics,
  WorkflowRequest
} from '@/types/team-management';

// Type guards for database responses
interface DatabaseTeamAnalytics {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  teamsByLocation: Record<string, number>;
  performanceByTeamType: Record<string, number>;
}

function isTeamAnalytics(data: any): data is DatabaseTeamAnalytics {
  return data && typeof data === 'object' && 
    'total_teams' in data && 'total_members' in data;
}

export class EnhancedTeamManagementService {
  async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase.rpc('get_enhanced_teams_data');
      
      if (error) throw error;

      return (data || []).map((item: any) => {
        const teamData = item.team_data;
        return {
          ...teamData,
          metadata: teamData.metadata || {},
          monthly_targets: teamData.monthly_targets || {},
          current_metrics: teamData.current_metrics || {},
          members: [] // Will be populated separately if needed
        } as EnhancedTeam;
      });
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
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;

      // Type-safe parsing with fallback
      if (data && isTeamAnalytics(data)) {
        return {
          totalTeams: data.total_teams,
          totalMembers: data.total_members,
          averagePerformance: data.performance_average,
          averageCompliance: data.compliance_score,
          teamsByLocation: data.teamsByLocation || {},
          performanceByTeamType: data.performanceByTeamType || {}
        };
      }

      // Fallback response
      return {
        totalTeams: 0,
        totalMembers: 0,
        averagePerformance: 0,
        averageCompliance: 0,
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
          teams!inner(name),
          requester:profiles!team_workflows_requested_by_fkey(display_name)
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
        requester: item.requester
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
