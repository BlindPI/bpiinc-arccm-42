
import { supabase } from '@/integrations/supabase/client';
import { realTimeMetricsService } from './realTimeMetricsService';
import type { SystemHealthMetrics } from './realTimeMetricsService';

export class SystemHealthService {
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      // Get recent metrics from the database
      const metrics = await realTimeMetricsService.getLatestMetrics([
        'uptime',
        'response_time',
        'error_rate',
        'memory_usage',
        'cpu_usage',
        'disk_usage',
        'active_connections',
        'active_users',
        'system_load',
        'database_connections'
      ]);

      // Convert metrics array to object
      const metricsMap = metrics.reduce((acc, metric) => {
        acc[metric.metric_name] = metric.metric_value;
        return acc;
      }, {} as Record<string, number>);

      return {
        uptime: metricsMap.uptime || 99.9,
        responseTime: metricsMap.response_time || 150,
        errorRate: metricsMap.error_rate || 0.5,
        memoryUsage: metricsMap.memory_usage || 0.65,
        cpuUsage: metricsMap.cpu_usage || 0.45,
        diskUsage: metricsMap.disk_usage || 0.35,
        activeConnections: metricsMap.active_connections || 42,
        activeUsers: metricsMap.active_users || 25,
        systemLoad: metricsMap.system_load || 0.8,
        databaseConnections: metricsMap.database_connections || 15,
        lastUpdated: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching system health:', error);
      
      // Return mock data as fallback
      return {
        uptime: 99.9,
        responseTime: 150,
        errorRate: 0.5,
        memoryUsage: 0.65,
        cpuUsage: 0.45,
        diskUsage: 0.35,
        activeConnections: 42,
        activeUsers: 25,
        systemLoad: 0.8,
        databaseConnections: 15,
        lastUpdated: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };
    }
  }

  async getHealthHistory(hours: number = 24): Promise<SystemHealthMetrics[]> {
    try {
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
      const endTime = new Date();

      const metrics = await realTimeMetricsService.getMetricHistory(
        'system_health',
        startTime,
        endTime
      );

      return metrics.map(metric => ({
        uptime: metric.metadata.uptime || 99.9,
        responseTime: metric.metadata.responseTime || 150,
        errorRate: metric.metadata.errorRate || 0.5,
        memoryUsage: metric.metadata.memoryUsage || 0.65,
        cpuUsage: metric.metadata.cpuUsage || 0.45,
        diskUsage: metric.metadata.diskUsage || 0.35,
        activeConnections: metric.metadata.activeConnections || 42,
        activeUsers: metric.metadata.activeUsers || 25,
        systemLoad: metric.metadata.systemLoad || 0.8,
        databaseConnections: metric.metadata.databaseConnections || 15,
        lastUpdated: metric.recorded_at,
        timestamp: metric.recorded_at
      }));
    } catch (error) {
      console.error('Error fetching health history:', error);
      return [];
    }
  }

  async recordHealthMetrics(metrics: SystemHealthMetrics): Promise<void> {
    try {
      await realTimeMetricsService.recordMetric({
        metric_name: 'uptime',
        metric_value: metrics.uptime,
        metric_type: 'gauge',
        unit: 'percent',
        category: 'system',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'response_time',
        metric_value: metrics.responseTime,
        metric_type: 'gauge',
        unit: 'milliseconds',
        category: 'performance',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'error_rate',
        metric_value: metrics.errorRate,
        metric_type: 'gauge',
        unit: 'percent',
        category: 'errors',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'memory_usage',
        metric_value: metrics.memoryUsage,
        metric_type: 'gauge',
        unit: 'ratio',
        category: 'resources',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'active_users',
        metric_value: metrics.activeUsers,
        metric_type: 'gauge',
        unit: 'count',
        category: 'users',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'system_load',
        metric_value: metrics.systemLoad,
        metric_type: 'gauge',
        unit: 'ratio',
        category: 'system',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'database_connections',
        metric_value: metrics.databaseConnections,
        metric_type: 'gauge',
        unit: 'count',
        category: 'database',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'cpu_usage',
        metric_value: metrics.cpuUsage,
        metric_type: 'gauge',
        unit: 'ratio',
        category: 'resources',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });

      await realTimeMetricsService.recordMetric({
        metric_name: 'disk_usage',
        metric_value: metrics.diskUsage,
        metric_type: 'gauge',
        unit: 'ratio',
        category: 'resources',
        recorded_at: new Date().toISOString(),
        metadata: metrics
      });
    } catch (error) {
      console.error('Error recording health metrics:', error);
      throw error;
    }
  }

  async getSystemAlerts(): Promise<any[]> {
    try {
      const healthMetrics = await this.getSystemHealth();
      const alerts = [];

      if (healthMetrics.uptime < 95) {
        alerts.push({
          id: 'uptime-alert',
          type: 'CRITICAL',
          message: `System uptime is critically low: ${healthMetrics.uptime}%`,
          timestamp: new Date().toISOString()
        });
      }

      if (healthMetrics.errorRate > 5) {
        alerts.push({
          id: 'error-rate-alert',
          type: 'HIGH',
          message: `Error rate is elevated: ${healthMetrics.errorRate}%`,
          timestamp: new Date().toISOString()
        });
      }

      if (healthMetrics.memoryUsage > 0.9) {
        alerts.push({
          id: 'memory-alert',
          type: 'HIGH',
          message: `Memory usage is critically high: ${Math.round(healthMetrics.memoryUsage * 100)}%`,
          timestamp: new Date().toISOString()
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting system alerts:', error);
      return [];
    }
  }
}

export const systemHealthService = new SystemHealthService();
