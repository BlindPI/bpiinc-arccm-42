import { supabase } from '@/integrations/supabase/client';

export interface UserActivity {
  userId: string;
  lastLogin?: string;
  loginCount: number;
  activitySummary: {
    totalSessions: number;
    averageSessionDuration: string;
    lastActiveDate: string;
  };
}

export class UserActivityService {
  /**
   * Get user activity data from Supabase auth logs and user_activity_logs
   */
  static async getUserActivity(userId: string): Promise<UserActivity> {
    try {
      // Try to get from user_activity_logs first
      const { data: activityLogs, error: activityError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (activityError) {
        console.warn('Could not fetch user activity logs:', activityError);
      }

      // Get user profile to check last updated time as fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('updated_at, created_at')
        .eq('id', userId)
        .single();

      // Calculate activity summary
      const loginActivities = activityLogs?.filter(log => 
        log.activity_type === 'login' || log.activity_type === 'authentication'
      ) || [];

      const lastLogin = loginActivities.length > 0 
        ? loginActivities[0].created_at 
        : profile?.updated_at || profile?.created_at;

      const totalSessions = loginActivities.length;
      const avgDuration = activityLogs?.reduce((acc, log) => acc + (log.duration_seconds || 0), 0) || 0;

      return {
        userId,
        lastLogin,
        loginCount: totalSessions,
        activitySummary: {
          totalSessions,
          averageSessionDuration: avgDuration > 0 ? `${Math.round(avgDuration / totalSessions / 60)} min` : 'N/A',
          lastActiveDate: lastLogin || 'Never'
        }
      };
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return {
        userId,
        loginCount: 0,
        activitySummary: {
          totalSessions: 0,
          averageSessionDuration: 'N/A',
          lastActiveDate: 'Never'
        }
      };
    }
  }

  /**
   * Log a new user activity
   */
  static async logActivity(
    userId: string,
    activityType: string,
    activityCategory: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_category: activityCategory,
          metadata: metadata || {},
          session_id: crypto.randomUUID()
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }

      // Update last_activity on team_members table
      await supabase
        .from('team_members')
        .update({ last_activity: new Date().toISOString() })
        .eq('user_id', userId);
        
    } catch (error) {
      console.error('Error logging user activity:', error);
    }
  }

  /**
   * Get bulk activity data for multiple users
   */
  static async getBulkUserActivity(userIds: string[]): Promise<Record<string, UserActivity>> {
    const activityMap: Record<string, UserActivity> = {};
    
    try {
      // Get activity data for all users
      const { data: activityLogs } = await supabase
        .from('user_activity_logs')
        .select('user_id, activity_type, created_at, duration_seconds')
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      // Get profiles as fallback
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, updated_at, created_at')
        .in('id', userIds);

      // Process each user
      for (const userId of userIds) {
        const userLogs = activityLogs?.filter(log => log.user_id === userId) || [];
        const userProfile = profiles?.find(p => p.id === userId);
        
        const loginActivities = userLogs.filter(log => 
          log.activity_type === 'login' || log.activity_type === 'authentication'
        );

        const lastLogin = loginActivities.length > 0 
          ? loginActivities[0].created_at 
          : userProfile?.updated_at || userProfile?.created_at;

        const totalSessions = loginActivities.length;
        const avgDuration = userLogs.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);

        activityMap[userId] = {
          userId,
          lastLogin,
          loginCount: totalSessions,
          activitySummary: {
            totalSessions,
            averageSessionDuration: avgDuration > 0 && totalSessions > 0 
              ? `${Math.round(avgDuration / totalSessions / 60)} min` 
              : 'N/A',
            lastActiveDate: lastLogin || 'Never'
          }
        };
      }
    } catch (error) {
      console.error('Error fetching bulk user activity:', error);
    }

    return activityMap;
  }
}