import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Types for real-time metrics
export interface RealTimeMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_unit: string;
  timestamp: string;
  category: string;
  metadata?: Record<string, any>;
}

export interface MetricSubscription {
  id: string;
  metric_name: string;
  callback: (metric: RealTimeMetric) => void;
  filters?: Record<string, any>;
}

export interface MetricAggregation {
  metric_name: string;
  period: 'minute' | 'hour' | 'day' | 'week' | 'month';
  aggregation_type: 'sum' | 'avg' | 'min' | 'max' | 'count';
  value: number;
  timestamp: string;
}

class RealTimeMetricsService {
  private static instance: RealTimeMetricsService;
  private subscriptions: Map<string, MetricSubscription> = new Map();
  private metricsBuffer: RealTimeMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  public static getInstance(): RealTimeMetricsService {
    if (!RealTimeMetricsService.instance) {
      RealTimeMetricsService.instance = new RealTimeMetricsService();
    }
    return RealTimeMetricsService.instance;
  }

  constructor() {
    this.startBufferFlush();
  }

  /**
   * Record a real-time metric
   */
  async recordMetric(
    metricName: string,
    value: number,
    unit: string,
    category: string = 'general',
    metadata?: Record<string, any>
  ): Promise<void> {
    const metric: RealTimeMetric = {
      id: crypto.randomUUID(),
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      timestamp: new Date().toISOString(),
      category,
      metadata
    };

    // Add to buffer for batch processing
    this.metricsBuffer.push(metric);

    // Notify subscribers immediately
    this.notifySubscribers(metric);

    // Flush buffer if it's full
    if (this.metricsBuffer.length >= this.BUFFER_SIZE) {
      await this.flushBuffer();
    }
  }

  /**
   * Subscribe to real-time metric updates
   */
  subscribe(
    metricName: string,
    callback: (metric: RealTimeMetric) => void,
    filters?: Record<string, any>
  ): string {
    const subscriptionId = crypto.randomUUID();
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      metric_name: metricName,
      callback,
      filters
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from metric updates
   */
  unsubscribe(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }

  /**
   * Get recent metrics
   */
  async getRecentMetrics(
    metricName?: string,
    category?: string,
    limit: number = 100,
    timeRange?: { start: string; end: string }
  ): Promise<RealTimeMetric[]> {
    try {
      // Query audit logs for performance metrics
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'performance_metric')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (timeRange) {
        query = query
          .gte('created_at', timeRange.start)
          .lte('created_at', timeRange.end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching recent metrics:', error);
        return [];
      }

      // Transform audit logs to metrics
      const metrics = (data || []).map(log => {
        const details = log.details as Record<string, any> || {};
        return {
          id: log.id,
          metric_name: details.metric_name || 'unknown',
          metric_value: details.metric_value || 0,
          metric_unit: details.metric_unit || 'count',
          timestamp: log.created_at || new Date().toISOString(),
          category: details.category || 'general',
          metadata: details
        };
      });

      // Apply filters
      let filteredMetrics = metrics;
      
      if (metricName) {
        filteredMetrics = filteredMetrics.filter(m => m.metric_name === metricName);
      }
      
      if (category) {
        filteredMetrics = filteredMetrics.filter(m => m.category === category);
      }

      return filteredMetrics;
    } catch (error) {
      console.error('Error getting recent metrics:', error);
      return [];
    }
  }

  /**
   * Get metric aggregations
   */
  async getMetricAggregations(
    metricName: string,
    period: MetricAggregation['period'],
    aggregationType: MetricAggregation['aggregation_type'],
    timeRange?: { start: string; end: string }
  ): Promise<MetricAggregation[]> {
    try {
      const metrics = await this.getRecentMetrics(
        metricName,
        undefined,
        1000,
        timeRange
      );

      if (metrics.length === 0) {
        return [];
      }

      // Group metrics by time period
      const groupedMetrics = this.groupMetricsByPeriod(metrics, period);
      
      // Calculate aggregations
      const aggregations: MetricAggregation[] = [];
      
      for (const [periodKey, periodMetrics] of groupedMetrics.entries()) {
        const values = periodMetrics.map(m => m.metric_value);
        let aggregatedValue: number;

        switch (aggregationType) {
          case 'sum':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0);
            break;
          case 'avg':
            aggregatedValue = values.reduce((sum, val) => sum + val, 0) / values.length;
            break;
          case 'min':
            aggregatedValue = Math.min(...values);
            break;
          case 'max':
            aggregatedValue = Math.max(...values);
            break;
          case 'count':
            aggregatedValue = values.length;
            break;
          default:
            aggregatedValue = 0;
        }

        aggregations.push({
          metric_name: metricName,
          period,
          aggregation_type: aggregationType,
          value: Number(aggregatedValue.toFixed(2)),
          timestamp: periodKey
        });
      }

      return aggregations.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error calculating metric aggregations:', error);
      return [];
    }
  }

  /**
   * Get live dashboard metrics
   */
  async getLiveDashboardMetrics(): Promise<Record<string, any>> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
      const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();

      const [
        recentMetrics,
        hourlyActivity,
        dailyTrends
      ] = await Promise.all([
        this.getRecentMetrics(undefined, undefined, 50),
        this.getMetricAggregations('activity_count', 'minute', 'sum', {
          start: oneHourAgo,
          end: now.toISOString()
        }),
        this.getMetricAggregations('activity_count', 'hour', 'sum', {
          start: oneDayAgo,
          end: now.toISOString()
        })
      ]);

      // Calculate key metrics
      const totalActivity = recentMetrics.length;
      const avgResponseTime = this.calculateAverageMetric(recentMetrics, 'response_time');
      const errorRate = this.calculateErrorRate(recentMetrics);
      const activeUsers = await this.getActiveUserCount();

      return {
        summary: {
          totalActivity,
          avgResponseTime,
          errorRate,
          activeUsers,
          lastUpdated: now.toISOString()
        },
        hourlyActivity: hourlyActivity.slice(-60), // Last 60 minutes
        dailyTrends: dailyTrends.slice(-24), // Last 24 hours
        recentMetrics: recentMetrics.slice(0, 20) // Latest 20 metrics
      };
    } catch (error) {
      console.error('Error getting live dashboard metrics:', error);
      return {
        summary: {
          totalActivity: 0,
          avgResponseTime: 0,
          errorRate: 0,
          activeUsers: 0,
          lastUpdated: new Date().toISOString()
        },
        hourlyActivity: [],
        dailyTrends: [],
        recentMetrics: []
      };
    }
  }

  /**
   * Start real-time monitoring for specific metrics
   */
  startMonitoring(metricNames: string[]): void {
    // In a real implementation, this would set up database triggers or polling
    console.log('Started monitoring metrics:', metricNames);
  }

  /**
   * Stop real-time monitoring
   */
  stopMonitoring(): void {
    this.subscriptions.clear();
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  // Private helper methods
  private async flushBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    try {
      // Store metrics in audit logs
      const auditEntries = this.metricsBuffer.map(metric => ({
        action: 'performance_metric',
        entity_type: 'metric',
        entity_id: metric.metric_name,
        details: {
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_unit: metric.metric_unit,
          category: metric.category,
          ...metric.metadata
        }
      }));

      await supabase
        .from('audit_logs')
        .insert(auditEntries);

      // Clear buffer
      this.metricsBuffer = [];
    } catch (error) {
      console.error('Error flushing metrics buffer:', error);
    }
  }

  private startBufferFlush(): void {
    this.flushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, this.FLUSH_INTERVAL);
  }

  private notifySubscribers(metric: RealTimeMetric): void {
    for (const subscription of this.subscriptions.values()) {
      if (subscription.metric_name === metric.metric_name || subscription.metric_name === '*') {
        // Apply filters if any
        if (this.matchesFilters(metric, subscription.filters)) {
          try {
            subscription.callback(metric);
          } catch (error) {
            console.error('Error in metric subscription callback:', error);
          }
        }
      }
    }
  }

  private matchesFilters(metric: RealTimeMetric, filters?: Record<string, any>): boolean {
    if (!filters) {
      return true;
    }

    for (const [key, value] of Object.entries(filters)) {
      if (key === 'category' && metric.category !== value) {
        return false;
      }
      if (key === 'min_value' && metric.metric_value < value) {
        return false;
      }
      if (key === 'max_value' && metric.metric_value > value) {
        return false;
      }
    }

    return true;
  }

  private groupMetricsByPeriod(
    metrics: RealTimeMetric[],
    period: MetricAggregation['period']
  ): Map<string, RealTimeMetric[]> {
    const grouped = new Map<string, RealTimeMetric[]>();

    for (const metric of metrics) {
      const date = new Date(metric.timestamp);
      let periodKey: string;

      switch (period) {
        case 'minute':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          break;
        case 'hour':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          periodKey = metric.timestamp;
      }

      if (!grouped.has(periodKey)) {
        grouped.set(periodKey, []);
      }
      grouped.get(periodKey)!.push(metric);
    }

    return grouped;
  }

  private calculateAverageMetric(metrics: RealTimeMetric[], metricName: string): number {
    const filteredMetrics = metrics.filter(m => m.metric_name === metricName);
    if (filteredMetrics.length === 0) {
      return 0;
    }

    const sum = filteredMetrics.reduce((total, metric) => total + metric.metric_value, 0);
    return Number((sum / filteredMetrics.length).toFixed(2));
  }

  private calculateErrorRate(metrics: RealTimeMetric[]): number {
    const errorMetrics = metrics.filter(m => m.metric_name === 'error_rate');
    if (errorMetrics.length === 0) {
      return 0;
    }

    return this.calculateAverageMetric(metrics, 'error_rate');
  }

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

      const uniqueUsers = new Set(data?.map(log => log.user_id) || []);
      return uniqueUsers.size;
    } catch (error) {
      console.warn('Error getting active user count:', error);
      return 0;
    }
  }
}

export const realTimeMetricsService = RealTimeMetricsService.getInstance();