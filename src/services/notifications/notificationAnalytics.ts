import { supabase } from '@/integrations/supabase/client';

export interface NotificationMetrics {
  totalNotifications: number;
  unreadNotifications: number;
  readRate: number;
  categoryDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  dailyTrends: Array<{
    date: string;
    created: number;
    read: number;
  }>;
  averageReadTime: number; // in minutes
  mostActiveCategories: Array<{
    category: string;
    count: number;
    readRate: number;
  }>;
}

export interface NotificationEngagementData {
  userId: string;
  notificationId: string;
  action: 'viewed' | 'clicked' | 'dismissed' | 'marked_read';
  timestamp: string;
  metadata?: Record<string, any>;
}

export class NotificationAnalytics {
  /**
   * Get comprehensive notification metrics for a user
   */
  static async getUserMetrics(userId: string, daysPeriod: number = 30): Promise<NotificationMetrics> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysPeriod);

      // Get all notifications for the user in the period
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifs = notifications || [];
      const totalNotifications = notifs.length;
      const unreadNotifications = notifs.filter(n => !n.read).length;
      const readRate = totalNotifications > 0 ? ((totalNotifications - unreadNotifications) / totalNotifications) * 100 : 0;

      // Category distribution
      const categoryDistribution = notifs.reduce((acc: Record<string, number>, notif) => {
        const category = notif.category || 'GENERAL';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      // Priority distribution
      const priorityDistribution = notifs.reduce((acc: Record<string, number>, notif) => {
        const priority = notif.priority || 'NORMAL';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
      }, {});

      // Daily trends
      const dailyTrends = this.calculateDailyTrends(notifs, daysPeriod);

      // Average read time (time between creation and reading)
      const readNotifications = notifs.filter(n => n.read && n.read_at);
      const averageReadTime = readNotifications.length > 0 
        ? readNotifications.reduce((sum, notif) => {
            const created = new Date(notif.created_at).getTime();
            const read = new Date(notif.read_at!).getTime();
            return sum + (read - created);
          }, 0) / readNotifications.length / (1000 * 60) // Convert to minutes
        : 0;

      // Most active categories with read rates
      const mostActiveCategories = Object.entries(categoryDistribution)
        .map(([category, count]) => {
          const categoryNotifs = notifs.filter(n => (n.category || 'GENERAL') === category);
          const readCount = categoryNotifs.filter(n => n.read).length;
          const readRate = count > 0 ? (readCount / count) * 100 : 0;
          
          return {
            category,
            count,
            readRate
          };
        })
        .sort((a, b) => b.count - a.count);

      return {
        totalNotifications,
        unreadNotifications,
        readRate,
        categoryDistribution,
        priorityDistribution,
        dailyTrends,
        averageReadTime,
        mostActiveCategories
      };

    } catch (error) {
      console.error('Failed to get user notification metrics:', error);
      throw error;
    }
  }

  /**
   * Get system-wide notification metrics (admin view)
   */
  static async getSystemMetrics(daysPeriod: number = 30): Promise<{
    totalUsers: number;
    totalNotifications: number;
    averageNotificationsPerUser: number;
    systemReadRate: number;
    categoryBreakdown: Record<string, { count: number; readRate: number }>;
    hourlyDistribution: Array<{ hour: number; count: number }>;
  }> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysPeriod);

      // Get all notifications in the period
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('user_id, category, priority, read, created_at')
        .gte('created_at', fromDate.toISOString());

      if (error) throw error;

      const notifs = notifications || [];
      const uniqueUsers = new Set(notifs.map(n => n.user_id)).size;
      const totalNotifications = notifs.length;
      const readNotifications = notifs.filter(n => n.read).length;
      const systemReadRate = totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0;

      // Category breakdown with read rates
      const categoryBreakdown = notifs.reduce((acc: Record<string, { count: number; readCount: number }>, notif) => {
        const category = notif.category || 'GENERAL';
        if (!acc[category]) {
          acc[category] = { count: 0, readCount: 0 };
        }
        acc[category].count++;
        if (notif.read) {
          acc[category].readCount++;
        }
        return acc;
      }, {});

      // Convert to final format with read rates
      const finalCategoryBreakdown = Object.fromEntries(
        Object.entries(categoryBreakdown).map(([category, data]) => [
          category,
          {
            count: data.count,
            readRate: data.count > 0 ? (data.readCount / data.count) * 100 : 0
          }
        ])
      );

      // Hourly distribution
      const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        count: notifs.filter(n => new Date(n.created_at).getHours() === hour).length
      }));

      return {
        totalUsers: uniqueUsers,
        totalNotifications,
        averageNotificationsPerUser: uniqueUsers > 0 ? totalNotifications / uniqueUsers : 0,
        systemReadRate,
        categoryBreakdown: finalCategoryBreakdown,
        hourlyDistribution
      };

    } catch (error) {
      console.error('Failed to get system notification metrics:', error);
      throw error;
    }
  }

  /**
   * Track notification engagement event
   */
  static async trackEngagement(data: NotificationEngagementData): Promise<void> {
    try {
      // Get current notification metadata
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('metadata')
        .eq('id', data.notificationId)
        .eq('user_id', data.userId)
        .single();

      if (fetchError) {
        console.error('Failed to fetch notification for engagement tracking:', fetchError);
        return;
      }

      // Update metadata with engagement data
      const currentMetadata = (notification?.metadata as any) || {};
      const engagements = currentMetadata.engagements || [];
      
      const updatedMetadata = {
        ...currentMetadata,
        engagements: [
          ...engagements,
          {
            action: data.action,
            timestamp: data.timestamp,
            metadata: data.metadata
          }
        ]
      };

      const { error } = await supabase
        .from('notifications')
        .update({ metadata: updatedMetadata })
        .eq('id', data.notificationId)
        .eq('user_id', data.userId);

      if (error) {
        console.error('Failed to track notification engagement:', error);
      }

    } catch (error) {
      console.error('Error tracking notification engagement:', error);
    }
  }

  /**
   * Calculate daily trends for notifications
   */
  private static calculateDailyTrends(notifications: any[], daysPeriod: number): Array<{
    date: string;
    created: number;
    read: number;
  }> {
    const trends: Record<string, { created: number; read: number }> = {};

    // Initialize all days in period
    for (let i = 0; i < daysPeriod; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = { created: 0, read: 0 };
    }

    // Count notifications by day
    notifications.forEach(notif => {
      const createdDate = new Date(notif.created_at).toISOString().split('T')[0];
      if (trends[createdDate]) {
        trends[createdDate].created++;
        if (notif.read && notif.read_at) {
          const readDate = new Date(notif.read_at).toISOString().split('T')[0];
          if (trends[readDate]) {
            trends[readDate].read++;
          }
        }
      }
    });

    return Object.entries(trends)
      .map(([date, data]) => ({
        date,
        created: data.created,
        read: data.read
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  /**
   * Get notification performance by category
   */
  static async getCategoryPerformance(userId?: string): Promise<Array<{
    category: string;
    totalSent: number;
    totalRead: number;
    readRate: number;
    averageReadTime: number;
    engagementRate: number;
  }>> {
    try {
      let query = supabase
        .from('notifications')
        .select('category, read, read_at, created_at, metadata');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: notifications, error } = await query;
      if (error) throw error;

      const notifs = notifications || [];
      const categoryPerformance = notifs.reduce((acc: Record<string, any>, notif) => {
        const category = notif.category || 'GENERAL';
        
        if (!acc[category]) {
          acc[category] = {
            totalSent: 0,
            totalRead: 0,
            readTimes: [],
            engagements: 0
          };
        }

        acc[category].totalSent++;
        
        if (notif.read) {
          acc[category].totalRead++;
          
          if (notif.read_at) {
            const readTime = new Date(notif.read_at).getTime() - new Date(notif.created_at).getTime();
            acc[category].readTimes.push(readTime);
          }
        }

        // Count engagements from metadata
        const metadata = notif.metadata as any;
        if (metadata && metadata.engagements && Array.isArray(metadata.engagements)) {
          acc[category].engagements += metadata.engagements.length;
        }

        return acc;
      }, {});

      return Object.entries(categoryPerformance).map(([category, data]: [string, any]) => ({
        category,
        totalSent: data.totalSent,
        totalRead: data.totalRead,
        readRate: data.totalSent > 0 ? (data.totalRead / data.totalSent) * 100 : 0,
        averageReadTime: data.readTimes.length > 0 
          ? data.readTimes.reduce((sum: number, time: number) => sum + time, 0) / data.readTimes.length / (1000 * 60)
          : 0,
        engagementRate: data.totalSent > 0 ? (data.engagements / data.totalSent) * 100 : 0
      }));

    } catch (error) {
      console.error('Failed to get category performance:', error);
      throw error;
    }
  }
}