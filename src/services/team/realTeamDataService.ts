
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMemberWithProfile, TeamAnalytics } from '@/types/team-management';

export class RealTeamDataService {
  // Helper to safely parse JSON from database
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

  static async getEnhancedTeam(teamId: string): Promise<EnhancedTeam | null> {
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
        .eq('id', teamId)
        .single();

      if (error) throw error;

      return {
        ...data,
        provider_id: data.provider_id?.toString(),
        metadata: this.safeJsonParse(data.metadata, {}),
        monthly_targets: this.safeJsonParse(data.monthly_targets, {}),
        current_metrics: this.safeJsonParse(data.current_metrics, {}),
        location: data.locations,
        provider: data.authorized_providers ? {
          id: data.authorized_providers.id?.toString(),
          name: data.authorized_providers.name,
          provider_type: data.authorized_providers.provider_type,
          status: data.authorized_providers.status,
          performance_rating: data.authorized_providers.performance_rating,
          compliance_score: data.authorized_providers.compliance_score,
          created_at: data.authorized_providers.created_at,
          updated_at: data.authorized_providers.updated_at,
          description: data.authorized_providers.description
        } : undefined,
        members: data.team_members?.map((member: any) => ({
          ...member,
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

  // New method to get enhanced teams using the database function
  static async getEnhancedTeams(): Promise<EnhancedTeam[]> {
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

  // New method to get team analytics
  static async getTeamAnalytics(): Promise<TeamAnalytics> {
    try {
      const { data, error } = await supabase.rpc('get_team_analytics_summary');
      
      if (error) throw error;

      return {
        totalTeams: data.total_teams || 0,
        totalMembers: data.total_members || 0,
        averagePerformance: data.performance_average || 0,
        averageCompliance: data.compliance_score || 0,
        teamsByLocation: data.teamsByLocation || {},
        performanceByTeamType: data.performanceByTeamType || {}
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

  static async getTeamMembers(teamId: string): Promise<TeamMemberWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles(*)
        `)
        .eq('team_id', teamId);

      if (error) throw error;

      return (data || []).map(member => ({
        ...member,
        display_name: member.profiles?.display_name || 'Unknown User',
        last_activity: member.last_activity || member.updated_at,
        profiles: member.profiles
      }));
    } catch (error) {
      console.error('Error fetching team members:', error);
      return [];
    }
  }

  private static safeJsonParse<T>(value: any, defaultValue: T): T {
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

export const realTeamDataService = new RealTeamDataService();
