
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'gauge' | 'counter' | 'histogram';
  unit: string;
  category: string;
  recorded_at: string;
  metadata?: Record<string, any>;
}

export interface MetricAggregation {
  metric: string;
  period: 'minute' | 'hour' | 'day';
  avg: number;
  min: number;
  max: number;
  count: number;
  sum: number;
}

export interface SystemHealthMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  systemLoad: number;
  dbConnections: number;
  memoryUsage: number;
  lastUpdated: Date;
}

export class RealTimeMetricsService {
  private metricsChannel: any = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  async recordMetric(
    name: string,
    value: number,
    unit: string = 'count',
    category: string = 'system',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('realtime_metrics')
        .insert({
          metric_name: name,
          metric_value: value,
          metric_type: 'gauge',
          unit,
          category,
          metadata: metadata || {},
          recorded_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  }

  async getMetricHistory(
    metricName: string,
    period: 'hour' | 'day' | 'week' = 'hour',
    limit: number = 100
  ): Promise<RealTimeMetric[]> {
    try {
      const timeRange = this.getTimeRange(period);
      
      const { data, error } = await supabase
        .from('realtime_metrics')
        .select('*')
        .eq('metric_name', metricName)
        .gte('recorded_at', timeRange)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting metric history:', error);
      return [];
    }
  }

  async getMetricAggregation(
    metricName: string,
    period: 'minute' | 'hour' | 'day' = 'hour'
  ): Promise<MetricAggregation | null> {
    try {
      const timeRange = this.getTimeRange(period);
      
      const { data, error } = await supabase
        .rpc('get_metric_aggregation', {
          p_metric_name: metricName,
          p_start_time: timeRange,
          p_period: period
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting metric aggregation:', error);
      return null;
    }
  }

  subscribeToMetrics(metricName: string, callback: (data: RealTimeMetric) => void): () => void {
    if (!this.subscribers.has(metricName)) {
      this.subscribers.set(metricName, new Set());
    }
    
    this.subscribers.get(metricName)!.add(callback);

    // Initialize realtime channel if not exists
    if (!this.metricsChannel) {
      this.initializeRealtimeChannel();
    }

    // Return unsubscribe function
    return () => {
      const metricSubscribers = this.subscribers.get(metricName);
      if (metricSubscribers) {
        metricSubscribers.delete(callback);
        if (metricSubscribers.size === 0) {
          this.subscribers.delete(metricName);
        }
      }
    };
  }

  private initializeRealtimeChannel(): void {
    this.metricsChannel = supabase
      .channel('realtime_metrics_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'realtime_metrics'
      }, (payload) => {
        const newMetric = payload.new as RealTimeMetric;
        const subscribers = this.subscribers.get(newMetric.metric_name);
        
        if (subscribers) {
          subscribers.forEach(callback => callback(newMetric));
        }
      })
      .subscribe();
  }

  private getTimeRange(period: string): string {
    const now = new Date();
    let hours = 1;

    switch (period) {
      case 'minute':
        hours = 1/60;
        break;
      case 'hour':
        hours = 1;
        break;
      case 'day':
        hours = 24;
        break;
      case 'week':
        hours = 24 * 7;
        break;
    }

    const timeRange = new Date(now.getTime() - (hours * 60 * 60 * 1000));
    return timeRange.toISOString();
  }

  disconnect(): void {
    if (this.metricsChannel) {
      supabase.removeChannel(this.metricsChannel);
      this.metricsChannel = null;
    }
    this.subscribers.clear();
  }
}

export const realTimeMetricsService = new RealTimeMetricsService();
