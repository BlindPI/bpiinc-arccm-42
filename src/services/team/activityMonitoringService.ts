
import { supabase } from '@/integrations/supabase/client';
import type { MemberActivityLog } from '@/types/enhanced-team-management';

export class ActivityMonitoringService {
  private static sessionId: string = this.generateSessionId();

  static generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  static async logActivity(
    userId: string,
    activityType: string,
    description?: string,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    try {
      const activityData = {
        user_id: userId,
        activity_type: activityType,
        activity_description: description,
        session_id: this.sessionId,
        metadata,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent
      };

      const { error } = await supabase
        .from('member_activity_logs')
        .insert(activityData);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  static async getUserActivityLogs(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<MemberActivityLog[]> {
    try {
      const { data, error } = await supabase
        .from('member_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user activity logs:', error);
      return [];
    }
  }

  static async getTeamActivityLogs(
    teamId: string,
    limit: number = 100
  ): Promise<(MemberActivityLog & { display_name: string })[]> {
    try {
      const { data, error } = await supabase
        .from('member_activity_logs')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .in('user_id', 
          supabase
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(log => ({
        ...log,
        display_name: (log.profiles as any)?.display_name || 'Unknown User'
      }));
    } catch (error) {
      console.error('Error fetching team activity logs:', error);
      return [];
    }
  }

  static async getRealtimeActivityStats(): Promise<{
    activeUsers: number;
    totalActivitiesToday: number;
    topActivities: { activity_type: string; count: number }[];
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's activities
      const { data: todayActivities, error: todayError } = await supabase
        .from('member_activity_logs')
        .select('activity_type, user_id')
        .gte('created_at', today + 'T00:00:00Z')
        .lt('created_at', today + 'T23:59:59Z');

      if (todayError) throw todayError;

      const uniqueUsers = new Set(todayActivities?.map(a => a.user_id) || []).size;
      const totalActivities = todayActivities?.length || 0;

      // Count activity types
      const activityCounts = todayActivities?.reduce((acc, activity) => {
        acc[activity.activity_type] = (acc[activity.activity_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topActivities = Object.entries(activityCounts)
        .map(([activity_type, count]) => ({ activity_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        activeUsers: uniqueUsers,
        totalActivitiesToday: totalActivities,
        topActivities
      };
    } catch (error) {
      console.error('Error fetching realtime activity stats:', error);
      return {
        activeUsers: 0,
        totalActivitiesToday: 0,
        topActivities: []
      };
    }
  }

  private static async getClientIP(): Promise<string | null> {
    try {
      // This is a simplified approach - in production you'd want a more robust solution
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  }
}

export const activityMonitoringService = new ActivityMonitoringService();
