
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
    // Mock implementation
    return {
      activeUsers: 15,
      totalSessions: 42,
      averageSessionDuration: 25
    };
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
