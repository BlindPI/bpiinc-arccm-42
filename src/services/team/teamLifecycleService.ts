
import { supabase } from '@/integrations/supabase/client';
import type { TeamLifecycleEvent } from '@/types/team-management';

export class TeamLifecycleService {
  static async logLifecycleEvent(
    teamId: string,
    eventType: string,
    eventData: Record<string, any>,
    performedBy: string,
    affectedUserId?: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('log_team_lifecycle_event', {
        p_team_id: teamId,
        p_event_type: eventType,
        p_event_data: eventData,
        p_affected_user_id: affectedUserId
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error logging lifecycle event:', error);
      throw error;
    }
  }

  static async getTeamLifecycleEvents(teamId: string): Promise<TeamLifecycleEvent[]> {
    try {
      const { data, error } = await supabase
        .from('team_lifecycle_events')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching lifecycle events:', error);
      return [];
    }
  }
}
