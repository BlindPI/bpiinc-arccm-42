import { supabase } from '@/integrations/supabase/client';

export class RealTimeDataService {
  static async getWorkflowStatistics() {
    try {
      const { data, error } = await supabase.rpc('get_workflow_statistics');
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching workflow statistics:', error);
      return {
        pending: 0,
        approved: 0,
        rejected: 0,
        total: 0,
        avgProcessingTime: '0 days',
        complianceRate: 0
      };
    }
  }

  static async getActivityMetrics() {
    try {
      // Update real-time metrics first
      await supabase.rpc('update_realtime_metrics');
      
      // Get the latest metrics
      const { data, error } = await supabase
        .from('realtime_metrics')
        .select('*')
        .gte('metric_timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('metric_timestamp', { ascending: false });

      if (error) throw error;

      const metrics = data?.reduce((acc, metric) => {
        acc[metric.metric_name] = metric.metric_value;
        return acc;
      }, {} as Record<string, number>) || {};

      return {
        activeUsers: metrics.active_users || 0,
        totalSessions: metrics.total_sessions || 0,
        averageSessionDuration: metrics.avg_session_duration || 0
      };
    } catch (error) {
      console.error('Error fetching activity metrics:', error);
      return {
        activeUsers: 0,
        totalSessions: 0,
        averageSessionDuration: 0
      };
    }
  }

  static async getEnrollmentTrends(days: number = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('student_roster_members')
        .select('created_at, enrollment_status')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day and status
      const trendsMap = new Map<string, { date: string; enrollments: number; completions: number }>();

      data?.forEach(enrollment => {
        const date = new Date(enrollment.created_at).toISOString().split('T')[0];
        
        if (!trendsMap.has(date)) {
          trendsMap.set(date, { date, enrollments: 0, completions: 0 });
        }
        
        const dayData = trendsMap.get(date)!;
        dayData.enrollments += 1;
        
        if (enrollment.enrollment_status === 'completed') {
          dayData.completions += 1;
        }
      });

      return Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error fetching enrollment trends:', error);
      return [];
    }
  }

  static async refreshTeamMetrics() {
    try {
      await supabase.rpc('refresh_team_performance_metrics');
    } catch (error) {
      console.error('Error refreshing team metrics:', error);
    }
  }

  // Add missing methods for compatibility
  static async subscribeToTeamActivityUpdates(teamId: string, callback: (data: any) => void): Promise<RealTimeSubscription> {
    // Implementation would use Supabase realtime subscriptions
    console.log('Team activity subscription not implemented yet');
    return { unsubscribe: () => {} };
  }

  static async subscribeToUserActivityUpdates(userId: string, callback: (data: any) => void): Promise<RealTimeSubscription> {
    // Implementation would use Supabase realtime subscriptions  
    console.log('User activity subscription not implemented yet');
    return { unsubscribe: () => {} };
  }
}

export interface RealTimeSubscription {
  unsubscribe: () => void;
}