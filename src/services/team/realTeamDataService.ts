
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMemberWithProfile, TeamAnalytics } from '@/types/team-management';

// Type guards and validation
function validateTeamStatus(status: string): 'active' | 'inactive' | 'suspended' {
  if (status === 'active' || status === 'inactive' || status === 'suspended') {
    return status;
  }
  return 'active'; // Default fallback
}

function validateAssignmentType(type: string | null): 'primary' | 'secondary' | 'temporary' {
  if (type === 'primary' || type === 'secondary' || type === 'temporary') {
    return type;
  }
  return 'primary'; // Default fallback
}

// Type guard for analytics data
function isAnalyticsData(data: any): data is {
  total_teams: number;
  total_members: number;
  performance_average: number;
  compliance_score: number;
  teamsByLocation?: Record<string, number>;
  performanceByTeamType?: Record<string, number>;
} {
  return data && typeof data === 'object' && 
    'total_teams' in data && 'total_members' in data;
}

export class RealTeamDataService {
  // Helper to safely parse JSON from database
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
        status: validateTeamStatus(data.status),
        provider_id: data.provider_id?.toString(),
        metadata: this.safeJsonParse(data.metadata, {}),
        monthly_targets: this.safeJsonParse(data.monthly_targets, {}),
        current_metrics: this.safeJsonParse(data.current_metrics, {}),
        location: data.locations,
        member_count: data.team_members?.length || 0,
        members: data.team_members?.map((member: any) => ({
          ...member,
          display_name: member.profiles?.display_name || 'Unknown User',
          last_activity: member.last_activity || member.updated_at,
          profiles: member.profiles
        })) || []
      } as EnhancedTeam;
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
          status: validateTeamStatus(teamData.status),
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

      // Type-safe parsing with validation
      if (data && isAnalyticsData(data)) {
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
}

export const realTeamDataService = new RealTeamDataService();
