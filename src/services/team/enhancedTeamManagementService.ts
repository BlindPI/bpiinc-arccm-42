
import { supabase } from '@/integrations/supabase/client';
import type { 
  EnhancedTeam, 
  TeamMemberWithProfile, 
  MembershipStatistics,
  TeamAnalytics 
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
        metadata: team.metadata || {},
        monthly_targets: team.monthly_targets || {},
        current_metrics: team.current_metrics || {},
        location: team.locations,
        provider: team.authorized_providers,
        members: team.team_members?.map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || 'Unknown User',
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

      return {
        totalTeams: analytics?.total_teams || 0,
        totalMembers: analytics?.total_members || 0,
        averagePerformance: analytics?.performance_average || 0,
        averageCompliance: analytics?.compliance_score || 0,
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
}

export const enhancedTeamManagementService = new EnhancedTeamManagementService();
