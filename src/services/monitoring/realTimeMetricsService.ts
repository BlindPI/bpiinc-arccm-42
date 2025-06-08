
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeMetric {
  id: string;
  metric_name: string;
  metric_value: number;
  metric_type: 'gauge' | 'counter' | 'histogram';
  unit: string;
  category: string;
  recorded_at: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface MetricAggregation {
  metric: string;
  period: string;
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
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  activeConnections: number;
  timestamp: string;
}

export class RealTimeMetricsService {
  async getLatestMetrics(metricNames?: string[]): Promise<RealTimeMetric[]> {
    try {
      let query = supabase
        .from('realtime_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(100);

      if (metricNames && metricNames.length > 0) {
        query = query.in('metric_name', metricNames);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data with proper type handling
      return (data || []).map(metric => ({
        id: metric.id,
        metric_name: metric.metric_name,
        metric_value: metric.metric_value,
        metric_type: this.normalizeMetricType(metric.metric_type),
        unit: metric.unit,
        category: metric.category,
        recorded_at: metric.recorded_at,
        metadata: this.parseMetadata(metric.metadata),
        created_at: metric.created_at
      }));
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      return [];
    }
  }

  async getMetricAggregation(
    metricName: string,
    startTime: Date,
    period: 'hour' | 'day' | 'week' = 'day'
  ): Promise<MetricAggregation[]> {
    try {
      const { data, error } = await supabase.rpc('get_metric_aggregation', {
        p_metric_name: metricName,
        p_start_time: startTime.toISOString(),
        p_period: period
      });

      if (error) throw error;

      // Return the aggregation results with proper structure
      return data || [];
    } catch (error) {
      console.error('Error fetching metric aggregation:', error);
      return [];
    }
  }

  private normalizeMetricType(type: string): 'gauge' | 'counter' | 'histogram' {
    // Normalize the metric type to match our union type
    const normalizedType = type?.toLowerCase();
    if (normalizedType === 'gauge' || normalizedType === 'counter' || normalizedType === 'histogram') {
      return normalizedType;
    }
    return 'gauge'; // Default fallback
  }

  private parseMetadata(metadata: any): Record<string, any> {
    if (!metadata) return {};
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch {
        return {};
      }
    }
    return metadata as Record<string, any>;
  }

  async recordMetric(metric: Omit<RealTimeMetric, 'id' | 'created_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('realtime_metrics')
        .insert({
          metric_name: metric.metric_name,
          metric_value: metric.metric_value,
          metric_type: metric.metric_type,
          unit: metric.unit,
          category: metric.category,
          recorded_at: metric.recorded_at,
          metadata: metric.metadata
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  }
}

export const realTimeMetricsService = new RealTimeMetricsService();
