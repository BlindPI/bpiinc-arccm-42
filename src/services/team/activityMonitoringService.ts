
import { supabase } from '@/integrations/supabase/client';

export interface MemberActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  activity_description: string;
  ip_address: string;
  user_agent: string;
  session_id: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivitySummary {
  userId: string;
  displayName: string;
  totalActivities: number;
  lastActivity: string;
  activityTypes: Record<string, number>;
  complianceScore: number;
}

// Helper function to safely cast ip_address
function safeCastIpAddress(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}

export class ActivityMonitoringService {
  static async getMemberActivities(
    teamId: string,
    timeRange?: { start: Date; end: Date },
    limit: number = 100
  ): Promise<MemberActivityLog[]> {
    try {
      let query = supabase
        .from('member_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start.toISOString())
          .lte('created_at', timeRange.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        ip_address: safeCastIpAddress(item.ip_address),
        metadata: typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {},
        created_at: item.created_at || new Date().toISOString(),
        user_agent: item.user_agent || '',
        session_id: item.session_id || '',
        activity_description: item.activity_description || ''
      })) as MemberActivityLog[];
    } catch (error) {
      console.error('Error fetching member activities:', error);
      return [];
    }
  }

  static async getTeamActivitySummary(teamId: string): Promise<ActivitySummary[]> {
    try {
      const { data, error } = await supabase
        .from('member_activity_logs')
        .select(`
          *,
          profiles!inner(display_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(item => ({
        userId: item.user_id || '',
        displayName: item.profiles?.display_name || 'Unknown User',
        totalActivities: 1,
        lastActivity: item.created_at || new Date().toISOString(),
        activityTypes: { [item.activity_type]: 1 },
        complianceScore: 95,
        ip_address: safeCastIpAddress(item.ip_address)
      })) as any[];
    } catch (error) {
      console.error('Error fetching team activity summary:', error);
      return [];
    }
  }

  static async logMemberActivity(
    userId: string,
    activityType: string,
    description: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      await supabase
        .from('member_activity_logs')
        .insert({
          user_id: userId,
          activity_type: activityType,
          activity_description: description,
          metadata,
          ip_address: ipAddress || '',
          user_agent: userAgent || '',
          session_id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging member activity:', error);
    }
  }

  static async getMemberRiskScore(userId: string): Promise<number> {
    try {
      // Calculate risk score based on activity patterns
      const { data: activities, error } = await supabase
        .from('member_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!activities || activities.length === 0) return 0;

      // Simple risk calculation
      let riskScore = 0;
      
      // High activity count could indicate automation/suspicious behavior
      if (activities.length > 1000) riskScore += 20;
      
      // Check for unusual patterns
      const uniqueIPs = new Set(activities.map(a => safeCastIpAddress(a.ip_address)).filter(Boolean));
      if (uniqueIPs.size > 10) riskScore += 15;

      // Check for failed activities
      const failedActivities = activities.filter(a => 
        a.activity_description?.toLowerCase().includes('failed') ||
        a.activity_description?.toLowerCase().includes('error')
      );
      riskScore += Math.min(failedActivities.length * 2, 25);

      return Math.min(riskScore, 100);
    } catch (error) {
      console.error('Error calculating member risk score:', error);
      return 0;
    }
  }

  static async getActivityTrends(
    teamId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'daily'
  ): Promise<any[]> {
    try {
      const daysBack = period === 'daily' ? 7 : period === 'weekly' ? 30 : 90;
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('member_activity_logs')
        .select('created_at, activity_type')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group activities by time period
      const trends: any[] = [];
      const groupedData = new Map<string, number>();

      data?.forEach(activity => {
        const date = new Date(activity.created_at);
        let key: string;
        
        if (period === 'daily') {
          key = date.toISOString().split('T')[0];
        } else if (period === 'weekly') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
        } else {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        groupedData.set(key, (groupedData.get(key) || 0) + 1);
      });

      groupedData.forEach((count, date) => {
        trends.push({ date, count });
      });

      return trends.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching activity trends:', error);
      return [];
    }
  }
}
