import { supabase } from '@/lib/supabase';

export interface NotificationPerformanceMetrics {
  totalNotifications: number;
  avgProcessingTime: number;
  successRate: number;
  errorRate: number;
  queueLength: number;
  peakHour: string;
  slowestCategory: string;
  fastestCategory: string;
  systemLoad: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

export interface NotificationQueueItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  retry_count: number;
  max_retries: number;
  created_at: string;
  scheduled_for: string;
  processing_started_at?: string;
  error_message?: string;
  metadata: Record<string, any>;
}

class NotificationPerformanceMonitor {
  private metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get real-time performance metrics from actual database
   */
  async getPerformanceMetrics(): Promise<NotificationPerformanceMetrics> {
    const cacheKey = 'performance_metrics';
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Get total notifications today
      const { count: totalCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Get processing times from metadata
      const { data: processedNotifications } = await supabase
        .from('notifications')
        .select('metadata, created_at, read_at')
        .not('read_at', 'is', null)
        .gte('created_at', today.toISOString());

      const processingTimes = (processedNotifications || [])
        .map(n => {
          if (n.read_at && n.created_at) {
            return new Date(n.read_at).getTime() - new Date(n.created_at).getTime();
          }
          return null;
        })
        .filter(time => time !== null) as number[];

      const avgProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0;

      // Get error statistics from metadata
      const { data: allNotifications } = await supabase
        .from('notifications')
        .select('metadata')
        .gte('created_at', today.toISOString());

      const errorCount = (allNotifications || [])
        .filter(n => n.metadata?.error_message).length;
      
      const successRate = totalCount && totalCount > 0 
        ? ((totalCount - errorCount) / totalCount) * 100 
        : 100;
      const errorRate = totalCount && totalCount > 0 
        ? (errorCount / totalCount) * 100 
        : 0;

      // Get current queue length (unread notifications)
      const { count: queueLength } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);

      // Get category performance
      const { data: categoryStats } = await supabase
        .from('notifications')
        .select('category, created_at, read_at')
        .not('read_at', 'is', null)
        .gte('created_at', today.toISOString());

      const categoryPerformance = this.calculateCategoryPerformance(categoryStats || []);

      // Get hourly distribution
      const { data: hourlyData } = await supabase
        .from('notifications')
        .select('created_at')
        .gte('created_at', today.toISOString());

      const hourlyStats = this.calculateHourlyDistribution(hourlyData || []);

      const metrics: NotificationPerformanceMetrics = {
        totalNotifications: totalCount || 0,
        avgProcessingTime: Math.round(avgProcessingTime / 1000), // Convert to seconds
        successRate: Math.round(successRate * 100) / 100,
        errorRate: Math.round(errorRate * 100) / 100,
        queueLength: queueLength || 0,
        peakHour: hourlyStats.peakHour,
        slowestCategory: categoryPerformance.slowest,
        fastestCategory: categoryPerformance.fastest,
        systemLoad: this.calculateSystemLoad(queueLength || 0, errorRate, avgProcessingTime),
        recommendations: this.generateRecommendations(queueLength || 0, errorRate, avgProcessingTime)
      };

      this.metricsCache.set(cacheKey, { data: metrics, timestamp: Date.now() });
      return metrics;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get actual notification queue status from database
   */
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    failed: number;
    scheduled: number;
    items: NotificationQueueItem[];
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('read', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const queueItems: NotificationQueueItem[] = (notifications || []).map(n => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        message: n.message,
        category: n.category,
        priority: n.priority,
        retry_count: n.metadata?.retry_count || 0,
        max_retries: 3,
        created_at: n.created_at,
        scheduled_for: n.metadata?.scheduled_for || n.created_at,
        processing_started_at: n.metadata?.processing_started_at,
        error_message: n.metadata?.error_message,
        metadata: n.metadata || {}
      }));

      const now = new Date();
      const pending = queueItems.filter(item => 
        !item.processing_started_at && 
        !item.error_message && 
        new Date(item.scheduled_for) <= now
      ).length;

      const processing = queueItems.filter(item => 
        item.processing_started_at && 
        !item.error_message
      ).length;

      const failed = queueItems.filter(item => 
        item.error_message || item.retry_count >= item.max_retries
      ).length;

      const scheduled = queueItems.filter(item => 
        new Date(item.scheduled_for) > now
      ).length;

      return {
        pending,
        processing,
        failed,
        scheduled,
        items: queueItems
      };
    } catch (error) {
      console.error('Error getting queue status:', error);
      throw error;
    }
  }

  /**
   * Log actual performance event to database
   */
  async logPerformanceEvent(event: {
    type: 'NOTIFICATION_SENT' | 'NOTIFICATION_FAILED' | 'QUEUE_PROCESSED' | 'SYSTEM_ALERT';
    details: Record<string, any>;
    timestamp?: Date;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          metadata: supabase.sql`metadata || ${JSON.stringify({
            performance_log: {
              ...event,
              timestamp: event.timestamp || new Date(),
              logged_at: new Date()
            }
          })}`
        })
        .eq('id', event.details.notification_id);

      if (error) {
        console.error('Error logging performance event:', error);
      }
    } catch (error) {
      console.error('Error logging performance event:', error);
    }
  }

  /**
   * Get detailed notification analytics from database
   */
  async getDetailedAnalytics(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day') {
    try {
      const startDate = this.getStartDate(timeRange);
      
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      return {
        total: notifications?.length || 0,
        byCategory: this.groupByCategory(notifications || []),
        byPriority: this.groupByPriority(notifications || []),
        byStatus: this.groupByStatus(notifications || []),
        timeline: this.generateTimeline(notifications || [], timeRange),
        userEngagement: this.calculateUserEngagement(notifications || [])
      };
    } catch (error) {
      console.error('Error getting detailed analytics:', error);
      throw error;
    }
  }

  /**
   * Mark notifications for retry
   */
  async retryFailedNotifications(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          metadata: supabase.sql`
            metadata || ${JSON.stringify({
              retry_scheduled: new Date(),
              retry_count: 'COALESCE((metadata->\'retry_count\')::int, 0) + 1'
            })}
          `
        })
        .in('id', notificationIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error retrying notifications:', error);
      throw error;
    }
  }

  /**
   * Private helper methods for real calculations
   */
  private calculateCategoryPerformance(notifications: any[]) {
    const categoryTimes: Record<string, number[]> = {};
    
    notifications.forEach(n => {
      if (n.read_at && n.created_at) {
        const processingTime = new Date(n.read_at).getTime() - new Date(n.created_at).getTime();
        if (!categoryTimes[n.category]) {
          categoryTimes[n.category] = [];
        }
        categoryTimes[n.category].push(processingTime);
      }
    });

    const categoryAvgs = Object.entries(categoryTimes).map(([category, times]) => ({
      category,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length
    }));

    categoryAvgs.sort((a, b) => b.avgTime - a.avgTime);

    return {
      slowest: categoryAvgs[0]?.category || 'GENERAL',
      fastest: categoryAvgs[categoryAvgs.length - 1]?.category || 'GENERAL'
    };
  }

  private calculateHourlyDistribution(notifications: any[]) {
    const hourCounts: Record<number, number> = {};
    
    notifications.forEach(n => {
      const hour = new Date(n.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '12';

    return {
      peakHour: `${peakHour}:00`
    };
  }

  private calculateSystemLoad(queueLength: number, errorRate: number, avgProcessingTime: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (queueLength > 1000 || errorRate > 20 || avgProcessingTime > 30000) {
      return 'CRITICAL';
    } else if (queueLength > 500 || errorRate > 10 || avgProcessingTime > 15000) {
      return 'HIGH';
    } else if (queueLength > 100 || errorRate > 5 || avgProcessingTime > 5000) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private generateRecommendations(queueLength: number, errorRate: number, avgProcessingTime: number): string[] {
    const recommendations: string[] = [];

    if (queueLength > 500) {
      recommendations.push('High queue length detected. Consider increasing processing capacity.');
    }
    if (errorRate > 10) {
      recommendations.push('High error rate detected. Review notification sending logic.');
    }
    if (avgProcessingTime > 10000) {
      recommendations.push('Slow processing detected. Optimize database queries and indexing.');
    }
    if (queueLength < 10 && errorRate < 2) {
      recommendations.push('System performance is optimal.');
    }

    return recommendations;
  }

  private getStartDate(timeRange: 'hour' | 'day' | 'week' | 'month'): Date {
    const now = new Date();
    switch (timeRange) {
      case 'hour':
        return new Date(now.getTime() - 60 * 60 * 1000);
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  }

  private groupByCategory(notifications: any[]) {
    return notifications.reduce((acc, n) => {
      acc[n.category] = (acc[n.category] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByPriority(notifications: any[]) {
    return notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByStatus(notifications: any[]) {
    return notifications.reduce((acc, n) => {
      const status = n.read ? 'READ' : 'UNREAD';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  private generateTimeline(notifications: any[], timeRange: string) {
    // Generate hourly timeline for real data visualization
    const timeline: Record<string, number> = {};
    
    notifications.forEach(n => {
      const date = new Date(n.created_at);
      const key = timeRange === 'hour' 
        ? `${date.getHours()}:00`
        : date.toISOString().split('T')[0];
      
      timeline[key] = (timeline[key] || 0) + 1;
    });

    return timeline;
  }

  private calculateUserEngagement(notifications: any[]) {
    const totalNotifications = notifications.length;
    const readNotifications = notifications.filter(n => n.read).length;
    const uniqueUsers = new Set(notifications.map(n => n.user_id)).size;

    return {
      readRate: totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0,
      avgNotificationsPerUser: uniqueUsers > 0 ? totalNotifications / uniqueUsers : 0,
      activeUsers: uniqueUsers
    };
  }
}

export const notificationPerformanceMonitor = new NotificationPerformanceMonitor();