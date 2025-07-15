
import { supabase } from '@/integrations/supabase/client';

export interface ActivityStats {
  activeUsers: number;
  totalSessions: number;
  averageSessionDuration: number;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description?: string;
  created_at: string;
}

export class ActivityMonitoringService {
  static async getRealtimeActivityStats(teamId: string): Promise<ActivityStats> {
    try {
      // Use real-time data service
      const { data, error } = await supabase.rpc('update_realtime_metrics');
      
      if (error) console.warn('Could not update realtime metrics:', error);

      // Get team-specific activity stats
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId)
        .eq('status', 'active');

      const userIds = teamMembers?.map(m => m.user_id) || [];
      
      if (userIds.length === 0) {
        return { activeUsers: 0, totalSessions: 0, averageSessionDuration: 0 };
      }

      // Count active users from team in last hour
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .in('id', userIds)
        .gte('last_sign_in_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Count sessions from access patterns
      const { count: totalSessions } = await supabase
        .from('access_patterns')
        .select('*', { count: 'exact', head: true })
        .in('user_id', userIds)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      // Calculate average session duration
      const { data: sessionData } = await supabase
        .from('access_patterns')
        .select('duration_seconds')
        .in('user_id', userIds)
        .not('duration_seconds', 'is', null)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

      const avgDuration = sessionData?.length 
        ? sessionData.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessionData.length / 60
        : 0;

      return {
        activeUsers: activeUsers || 0,
        totalSessions: totalSessions || 0,
        averageSessionDuration: Math.round(avgDuration)
      };
    } catch (error) {
      console.error('Error getting realtime activity stats:', error);
      return { activeUsers: 0, totalSessions: 0, averageSessionDuration: 0 };
    }
  }

  static async getTeamActivityLogs(teamId: string, limit: number = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('member_activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async logActivity(userId: string, activityType: string, description?: string): Promise<void> {
    const { error } = await supabase
      .from('member_activity_logs')
      .insert({
        user_id: userId,
        activity_type: activityType,
        activity_description: description,
        metadata: {}
      });

    if (error) throw error;
  }
}
