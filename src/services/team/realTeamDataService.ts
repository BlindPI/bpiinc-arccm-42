
import { supabase } from '@/integrations/supabase/client';
import type { EnhancedTeam, TeamMemberWithProfile } from '@/types/team-management';

export class RealTeamDataService {
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
        metadata: data.metadata || {},
        monthly_targets: data.monthly_targets || {},
        current_metrics: data.current_metrics || {},
        location: data.locations,
        provider: data.authorized_providers,
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
