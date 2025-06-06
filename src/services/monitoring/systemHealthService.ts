import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for system health monitoring
export interface SystemHealthMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  diskUsage: number;
  databaseConnections: number;
  lastUpdated: string;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  recorded_at: string;
  metadata?: Record<string, any>;
}

class SystemHealthService {
  private static instance: SystemHealthService;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  public static getInstance(): SystemHealthService {
    if (!SystemHealthService.instance) {
      SystemHealthService.instance = new SystemHealthService();
    }
    return SystemHealthService.instance;
  }

  /**
   * Get current system health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetrics> {
    try {
      // Get basic system metrics from various sources
      const [
        uptimeData,
        responseTimeData,
        errorRateData,
        activeUsersData,
        systemLoadData
      ] = await Promise.all([
        this.getSystemUptime(),
        this.getAverageResponseTime(),
        this.getErrorRate(),
        this.getActiveUserCount(),
        this.getSystemLoad()
      ]);

      return {
        uptime: uptimeData,
        responseTime: responseTimeData,
        errorRate: errorRateData,
        activeUsers: activeUsersData,
        systemLoad: systemLoadData,
        memoryUsage: await this.getMemoryUsage(),
        diskUsage: await this.getDiskUsage(),
        databaseConnections: await this.getDatabaseConnections(),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting system health:', error);
      throw new Error('Failed to retrieve system health metrics');
    }
  }

  /**
   * Get system uptime percentage
   */
  private async getSystemUptime(): Promise<number> {
    try {
      // Calculate uptime based on system activity in audit logs
      const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('created_at')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return 99.9; // Default uptime if no data
      }

      // Simple uptime calculation based on activity distribution
      const now = Date.now();
      const oneDayMs = 86400000;
      const intervals = 24; // Check hourly intervals
      const intervalMs = oneDayMs / intervals;
      
      let activeIntervals = 0;
      for (let i = 0; i < intervals; i++) {
        const intervalStart = now - (i + 1) * intervalMs;
        const intervalEnd = now - i * intervalMs;
        
        const hasActivity = data.some(log => {
          const logTime = new Date(log.created_at!).getTime();
          return logTime >= intervalStart && logTime < intervalEnd;
        });
        
        if (hasActivity) activeIntervals++;
      }
      
      return Number(((activeIntervals / intervals) * 100).toFixed(1));
    } catch (error) {
      console.warn('Error calculating uptime:', error);
      return 99.9;
    }
  }

  /**
   * Get average response time (simulated)
   */
  private async getAverageResponseTime(): Promise<number> {
    try {
      // Simulate response time based on recent activity volume
      const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .gte('created_at', fiveMinutesAgo);

      if (error) {
        return 150; // Default response time
      }

      const activityCount = data?.length || 0;
      // Simulate: more activity = higher response time
      const baseResponseTime = 120;
      const loadFactor = Math.min(activityCount / 10, 5); // Cap at 5x multiplier
      
      return Math.round(baseResponseTime + (loadFactor * 30));
    } catch (error) {
      console.warn('Error calculating response time:', error);
      return 150;
    }
  }

  /**
   * Get error rate percentage
   */
  private async getErrorRate(): Promise<number> {
    try {
      const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
      
      // Count error-related actions
      const { data: errorLogs, error: errorLogsError } = await supabase
        .from('audit_logs')
        .select('id')
        .eq('action', 'error')
        .gte('created_at', oneHourAgo);

      const { data: totalLogs, error: totalLogsError } = await supabase
        .from('audit_logs')
        .select('id')
        .gte('created_at', oneHourAgo);

      if (errorLogsError || totalLogsError || !totalLogs || totalLogs.length === 0) {
        return 0.1; // Default low error rate
      }

      const errorCount = errorLogs?.length || 0;
      const totalCount = totalLogs.length;
      
      return Number(((errorCount / totalCount) * 100).toFixed(2));
    } catch (error) {
      console.warn('Error calculating error rate:', error);
      return 0.1;
    }
  }

  /**
   * Get active user count
   */
  private async getActiveUserCount(): Promise<number> {
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 900000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('user_id')
        .gte('created_at', fifteenMinutesAgo)
        .not('user_id', 'is', null);

      if (error) {
        return 0;
      }

      // Count unique users
      const uniqueUsers = new Set(data?.map(log => log.user_id) || []);
      return uniqueUsers.size;
    } catch (error) {
      console.warn('Error getting active user count:', error);
      return 0;
    }
  }

  /**
   * Get system load (simulated)
   */
  private async getSystemLoad(): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 300000).toISOString();
      
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .gte('created_at', fiveMinutesAgo);

      if (error) {
        return 0.3; // Default low load
      }

      const activityCount = data?.length || 0;
      // Normalize to 0-1 scale (assuming 50+ activities in 5 min = high load)
      return Math.min(activityCount / 50, 1);
    } catch (error) {
      console.warn('Error calculating system load:', error);
      return 0.3;
    }
  }

  /**
   * Get memory usage (simulated)
   */
  private async getMemoryUsage(): Promise<number> {
    // Simulate memory usage - in real implementation, this would come from system metrics
    return 0.65; // 65% memory usage
  }

  /**
   * Get disk usage (simulated)
   */
  private async getDiskUsage(): Promise<number> {
    // Simulate disk usage - in real implementation, this would come from system metrics
    return 0.45; // 45% disk usage
  }

  /**
   * Get database connections count
   */
  private async getDatabaseConnections(): Promise<number> {
    try {
      // Simulate based on recent activity
      const { data, error } = await supabase
        .from('audit_logs')
        .select('id')
        .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
        .limit(50);

      if (error) {
        return 5; // Default connection count
      }

      return Math.max(data?.length || 0, 5);
    } catch (error) {
      console.warn('Error getting database connections:', error);
      return 5;
    }
  }

  /**
   * Get system alerts
   */
  async getSystemAlerts(limit: number = 50): Promise<SystemAlert[]> {
    try {
      // Get alerts from audit logs where action indicates an alert/error
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .in('action', ['error', 'warning', 'alert'])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching alerts:', error);
        return [];
      }

      return (data || []).map(log => ({
        id: log.id,
        type: this.mapActionToAlertType(log.action),
        message: this.extractAlertMessage(log),
        severity: this.determineSeverity(log),
        timestamp: log.created_at || new Date().toISOString(),
        resolved: false, // Would need additional logic to determine resolution
        metadata: log.details as Record<string, any> || {}
      }));
    } catch (error) {
      console.error('Error getting system alerts:', error);
      return [];
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(
    metricName?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 100
  ): Promise<PerformanceMetric[]> {
    try {
      // Since we don't have performance_metrics table yet, simulate with audit logs
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching performance metrics:', error);
        return [];
      }

      // Transform audit logs into performance metrics
      return (data || []).map(log => ({
        id: log.id,
        metric_name: metricName || 'activity_count',
        metric_value: 1, // Each log represents one unit of activity
        metric_unit: 'count',
        recorded_at: log.created_at || new Date().toISOString(),
        metadata: log.details as Record<string, any> || {}
      }));
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return [];
    }
  }

  /**
   * Record a performance metric
   */
  async recordPerformanceMetric(
    metricName: string,
    metricValue: number,
    metricUnit: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      // Record as audit log until performance_metrics table is available
      await supabase
        .from('audit_logs')
        .insert({
          action: 'performance_metric',
          entity_type: 'system',
          entity_id: metricName,
          details: {
            metric_name: metricName,
            metric_value: metricValue,
            metric_unit: metricUnit,
            ...metadata
          }
        });
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw new Error('Failed to record performance metric');
    }
  }

  /**
   * Create a system alert
   */
  async createAlert(
    type: SystemAlert['type'],
    message: string,
    severity: SystemAlert['severity'],
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await supabase
        .from('audit_logs')
        .insert({
          action: type,
          entity_type: 'system',
          entity_id: 'alert',
          details: {
            message,
            severity,
            alert_type: type,
            ...metadata
          }
        });
    } catch (error) {
      console.error('Error creating alert:', error);
      throw new Error('Failed to create system alert');
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      return; // Already running
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.getSystemHealth();
        
        // Check for critical thresholds and create alerts
        if (health.uptime < 95) {
          await this.createAlert('error', `System uptime is low: ${health.uptime}%`, 'high');
        }
        
        if (health.errorRate > 5) {
          await this.createAlert('warning', `High error rate detected: ${health.errorRate}%`, 'medium');
        }
        
        if (health.responseTime > 1000) {
          await this.createAlert('warning', `High response time: ${health.responseTime}ms`, 'medium');
        }

        // Record metrics
        await this.recordPerformanceMetric('uptime', health.uptime, 'percentage');
        await this.recordPerformanceMetric('response_time', health.responseTime, 'milliseconds');
        await this.recordPerformanceMetric('error_rate', health.errorRate, 'percentage');
        await this.recordPerformanceMetric('active_users', health.activeUsers, 'count');
        
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  // Helper methods
  private mapActionToAlertType(action: string): SystemAlert['type'] {
    switch (action) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  }

  private extractAlertMessage(log: any): string {
    if (log.details && typeof log.details === 'object' && log.details.message) {
      return log.details.message;
    }
    return `System ${log.action} in ${log.entity_type}`;
  }

  private determineSeverity(log: any): SystemAlert['severity'] {
    if (log.details && typeof log.details === 'object' && log.details.severity) {
      return log.details.severity;
    }
    
    switch (log.action) {
      case 'error':
        return 'high';
      case 'warning':
        return 'medium';
      default:
        return 'low';
    }
  }
}

export const systemHealthService = SystemHealthService.getInstance();