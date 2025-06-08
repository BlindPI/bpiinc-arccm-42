
import { supabase } from '@/integrations/supabase/client';
import { realTimeMetricsService } from './realTimeMetricsService';
import type { SystemHealthMetrics } from './realTimeMetricsService';

export class SystemHealthService {
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      // Get current system metrics
      const [
        uptimeMetric,
        responseTimeMetric,
        errorRateMetric,
        activeUsersMetric
      ] = await Promise.all([
        this.getCurrentMetric('uptime'),
        this.getCurrentMetric('response_time'),
        this.getCurrentMetric('error_rate'),
        this.getActiveUsersCount()
      ]);

      return {
        uptime: uptimeMetric?.metric_value || 99.9,
        responseTime: responseTimeMetric?.metric_value || 150,
        errorRate: errorRateMetric?.metric_value || 0.1,
        activeUsers: activeUsersMetric,
        systemLoad: await this.getSystemLoad(),
        dbConnections: await this.getDbConnectionCount(),
        memoryUsage: await this.getMemoryUsage(),
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      // Return default values on error
      return {
        uptime: 0,
        responseTime: 0,
        errorRate: 100,
        activeUsers: 0,
        systemLoad: 0,
        dbConnections: 0,
        memoryUsage: 0,
        lastUpdated: new Date()
      };
    }
  }

  private async getCurrentMetric(metricName: string) {
    const { data, error } = await supabase
      .from('realtime_metrics')
      .select('*')
      .eq('metric_name', metricName)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      // Count unique users with activity in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('access_patterns')
        .select('user_id')
        .gte('created_at', fifteenMinutesAgo.toISOString())
        .not('user_id', 'is', null);

      if (error) return 0;
      
      const uniqueUsers = new Set(data.map(record => record.user_id));
      return uniqueUsers.size;
    } catch (error) {
      console.error('Error getting active users count:', error);
      return 0;
    }
  }

  private async getSystemLoad(): Promise<number> {
    try {
      // Calculate system load based on database activity
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 60 * 1000).toISOString());

      if (error) return 0;
      
      // Normalize to percentage (assuming 100 operations per minute is 100% load)
      return Math.min((data.length / 100) * 100, 100);
    } catch (error) {
      console.error('Error calculating system load:', error);
      return 0;
    }
  }

  private async getDbConnectionCount(): Promise<number> {
    try {
      // This would typically come from database monitoring
      // For now, return a calculated estimate
      const activeUsers = await this.getActiveUsersCount();
      return Math.max(activeUsers * 2, 5); // Estimate 2 connections per active user
    } catch (error) {
      console.error('Error getting DB connection count:', error);
      return 0;
    }
  }

  private async getMemoryUsage(): Promise<number> {
    try {
      // This would typically come from system monitoring
      // For now, calculate based on activity
      const systemLoad = await this.getSystemLoad();
      return Math.min(systemLoad * 0.8 + 20, 95); // Base 20% + load factor
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return 0;
    }
  }

  async recordHealthMetrics(): Promise<void> {
    const health = await this.getSystemHealth();
    
    // Record individual metrics
    await Promise.all([
      realTimeMetricsService.recordMetric('uptime', health.uptime, 'percentage', 'system'),
      realTimeMetricsService.recordMetric('response_time', health.responseTime, 'milliseconds', 'performance'),
      realTimeMetricsService.recordMetric('error_rate', health.errorRate, 'percentage', 'system'),
      realTimeMetricsService.recordMetric('active_users', health.activeUsers, 'count', 'user'),
      realTimeMetricsService.recordMetric('system_load', health.systemLoad, 'percentage', 'performance'),
      realTimeMetricsService.recordMetric('db_connections', health.dbConnections, 'count', 'database'),
      realTimeMetricsService.recordMetric('memory_usage', health.memoryUsage, 'percentage', 'performance')
    ]);
  }
}

export const systemHealthService = new SystemHealthService();
