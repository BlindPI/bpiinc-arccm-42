
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  metricName: string;
  metricType: 'api_response' | 'database_query' | 'cache_hit' | 'user_action';
  metricValue: number;
  metricUnit?: string;
  endpointPath?: string;
  metadata?: Record<string, any>;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static flushInterval: NodeJS.Timeout | null = null;
  
  static init() {
    // Flush metrics every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 30000);
    
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageLoad();
      });
    }
  }
  
  static trackMetric(metric: PerformanceMetric) {
    this.metrics.push({
      ...metric,
      metadata: {
        timestamp: Date.now(),
        sessionId: this.getSessionId(),
        ...metric.metadata
      }
    });
    
    // Auto-flush if we have too many metrics
    if (this.metrics.length >= 100) {
      this.flushMetrics();
    }
  }
  
  static async trackApiCall<T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await apiCall();
      const duration = performance.now() - startTime;
      
      this.trackMetric({
        metricName: 'api_response_time',
        metricType: 'api_response',
        metricValue: duration,
        metricUnit: 'ms',
        endpointPath: endpoint,
        metadata: { success: true }
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.trackMetric({
        metricName: 'api_response_time',
        metricType: 'api_response',
        metricValue: duration,
        metricUnit: 'ms',
        endpointPath: endpoint,
        metadata: { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      });
      
      throw error;
    }
  }
  
  static trackUserAction(action: string, metadata?: Record<string, any>) {
    this.trackMetric({
      metricName: action,
      metricType: 'user_action',
      metricValue: 1,
      metricUnit: 'count',
      metadata
    });
  }
  
  static trackCacheHit(cacheKey: string, hit: boolean) {
    this.trackMetric({
      metricName: 'cache_performance',
      metricType: 'cache_hit',
      metricValue: hit ? 1 : 0,
      metricUnit: 'boolean',
      metadata: { cacheKey, hit }
    });
  }
  
  private static async flushMetrics() {
    if (this.metrics.length === 0) return;
    
    const metricsToFlush = [...this.metrics];
    this.metrics = [];
    
    try {
      const { error } = await supabase
        .from('performance_metrics')
        .insert(
          metricsToFlush.map(metric => ({
            metric_name: metric.metricName,
            metric_type: metric.metricType,
            metric_value: metric.metricValue,
            metric_unit: metric.metricUnit || 'ms',
            endpoint_path: metric.endpointPath,
            metadata: metric.metadata || {}
          }))
        );
      
      if (error) throw error;
    } catch (error) {
      console.error('Error flushing performance metrics:', error);
      // Re-queue metrics for next flush
      this.metrics.unshift(...metricsToFlush);
    }
  }
  
  private static trackPageLoad() {
    if (typeof window === 'undefined') return;
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      this.trackMetric({
        metricName: 'page_load_time',
        metricType: 'user_action',
        metricValue: navigation.loadEventEnd - navigation.fetchStart,
        metricUnit: 'ms',
        metadata: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: this.getFirstPaint(),
          pageUrl: window.location.pathname
        }
      });
    }
  }
  
  private static getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  
  private static getSessionId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let sessionId = sessionStorage.getItem('performance-session-id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('performance-session-id', sessionId);
    }
    return sessionId;
  }
  
  static async getMetrics(timeRange: '1h' | '24h' | '7d' = '24h'): Promise<any[]> {
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
    
    try {
      const { data, error } = await supabase
        .from('performance_dashboard')
        .select('*')
        .gte('hour_bucket', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString());
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return [];
    }
  }
  
  static cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushMetrics(); // Final flush
  }
}

// Initialize performance monitoring
PerformanceMonitor.init();
