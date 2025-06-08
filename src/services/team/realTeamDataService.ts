
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamAnalytics } from '@/types/team-management';

export class RealTeamDataService {
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .eq('status', 'active')
        .order('name');

      if (error) throw error;

      return (data || []).map(team => ({
        ...team,
        provider_id: team.provider_id?.toString(),
        status: team.status as 'active' | 'inactive' | 'suspended',
        metadata: (team.metadata as Record<string, any>) || {},
        monthly_targets: (team.monthly_targets as Record<string, any>) || {},
        current_metrics: (team.current_metrics as Record<string, any>) || {},
        location: team.locations,
        member_count: team.team_members?.length || 0,
        members: team.team_members?.map((member: any) => ({
          ...member,
          role: member.role as 'MEMBER' | 'ADMIN',
          status: member.status as 'active' | 'inactive' | 'suspended' | 'on_leave',
          permissions: member.permissions || {},
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

  static async getEnhancedTeam(teamId: string): Promise<EnhancedTeam | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          locations(*),
          team_members(
            *,
            profiles(*)
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;

      return {
        ...data,
        provider_id: data.provider_id?.toString(),
        status: data.status as 'active' | 'inactive' | 'suspended',
        metadata: (data.metadata as Record<string, any>) || {},
        monthly_targets: (data.monthly_targets as Record<string, any>) || {},
        current_metrics: (data.current_metrics as Record<string, any>) || {},
        location: data.locations,
        member_count: data.team_members?.length || 0,
        members: data.team_members?.map((member: any) => ({
          ...member,
          role: member.role as 'MEMBER' | 'ADMIN',
          status: member.status as 'active' | 'inactive' | 'suspended' | 'on_leave',
          permissions: member.permissions || {},
          display_name: member.profiles?.display_name || 'Unknown User',
          last_activity: member.last_activity || member.updated_at,
          profiles: member.profiles
        })) || []
      };
    } catch (error) {
      console.error('Error fetching enhanced team:', error);
      return null;
    }
  }

  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const analytics = data as any;
        return {
          totalTeams: analytics.total_teams || 0,
          totalMembers: analytics.total_members || 0,
          averagePerformance: analytics.performance_average || 0,
          averageCompliance: analytics.compliance_score || 0,
          teamsByLocation: analytics.teamsByLocation || {},
          performanceByTeamType: analytics.performanceByTeamType || {}
        };
      }

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
}

export const realTeamDataService = new RealTeamDataService();
