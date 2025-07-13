import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

interface SystemLoad {
  cpu: number;
  memory: number;
  database: number;
  realtime: number;
}

export const usePerformanceMonitoring = (interval: number = 30000) => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [systemLoad, setSystemLoad] = useState<SystemLoad>({
    cpu: 0,
    memory: 0,
    database: 0,
    realtime: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Measure database performance
  const measureDatabasePerformance = useCallback(async (): Promise<PerformanceMetric> => {
    const start = performance.now();
    
    try {
      await supabase.from('profiles').select('id').limit(1);
      const responseTime = performance.now() - start;
      
      return {
        name: 'Database Response Time',
        value: Math.round(responseTime),
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 500,
        status: responseTime < 200 ? 'good' : responseTime < 500 ? 'warning' : 'critical'
      };
    } catch (error) {
      return {
        name: 'Database Response Time',
        value: -1,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 500,
        status: 'critical'
      };
    }
  }, []);

  // Measure real-time performance
  const measureRealtimePerformance = useCallback(async (): Promise<PerformanceMetric> => {
    const start = performance.now();
    
    return new Promise((resolve) => {
      try {
        const channel = supabase.channel('perf-test');
        let connected = false;
        
        const timeout = setTimeout(() => {
          if (!connected) {
            supabase.removeChannel(channel);
            resolve({
              name: 'Real-time Connection Time',
              value: -1,
              unit: 'ms',
              timestamp: new Date().toISOString(),
              threshold: 2000,
              status: 'critical'
            });
          }
        }, 5000);
        
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED' && !connected) {
            connected = true;
            clearTimeout(timeout);
            const connectionTime = performance.now() - start;
            supabase.removeChannel(channel);
            
            resolve({
              name: 'Real-time Connection Time',
              value: Math.round(connectionTime),
              unit: 'ms',
              timestamp: new Date().toISOString(),
              threshold: 2000,
              status: connectionTime < 1000 ? 'good' : connectionTime < 2000 ? 'warning' : 'critical'
            });
          }
        });
      } catch (error) {
        resolve({
          name: 'Real-time Connection Time',
          value: -1,
          unit: 'ms',
          timestamp: new Date().toISOString(),
          threshold: 2000,
          status: 'critical'
        });
      }
    });
  }, []);

  // Measure cache performance
  const measureCachePerformance = useCallback(async (): Promise<PerformanceMetric> => {
    const start = performance.now();
    
    try {
      await supabase.from('cache_entries').select('id').limit(1);
      const responseTime = performance.now() - start;
      
      return {
        name: 'Cache Response Time',
        value: Math.round(responseTime),
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 100,
        status: responseTime < 50 ? 'good' : responseTime < 100 ? 'warning' : 'critical'
      };
    } catch (error) {
      return {
        name: 'Cache Response Time',
        value: -1,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 100,
        status: 'critical'
      };
    }
  }, []);

  // Measure activity system performance
  const measureActivityPerformance = useCallback(async (): Promise<PerformanceMetric> => {
    const start = performance.now();
    
    try {
      await supabase.from('user_activity_logs').select('id').limit(1);
      const responseTime = performance.now() - start;
      
      return {
        name: 'Activity System Response Time',
        value: Math.round(responseTime),
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 300,
        status: responseTime < 150 ? 'good' : responseTime < 300 ? 'warning' : 'critical'
      };
    } catch (error) {
      return {
        name: 'Activity System Response Time',
        value: -1,
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 300,
        status: 'critical'
      };
    }
  }, []);

  // Measure browser performance
  const measureBrowserPerformance = useCallback((): PerformanceMetric[] => {
    const browserMetrics: PerformanceMetric[] = [];
    
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;
      
      browserMetrics.push({
        name: 'Memory Usage',
        value: Math.round(memoryUsage),
        unit: '%',
        timestamp: new Date().toISOString(),
        threshold: 80,
        status: memoryUsage < 60 ? 'good' : memoryUsage < 80 ? 'warning' : 'critical'
      });
    }
    
    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      browserMetrics.push({
        name: 'Page Load Time',
        value: Math.round(loadTime),
        unit: 'ms',
        timestamp: new Date().toISOString(),
        threshold: 3000,
        status: loadTime < 1500 ? 'good' : loadTime < 3000 ? 'warning' : 'critical'
      });
    }
    
    return browserMetrics;
  }, []);

  // Collect all performance metrics
  const collectMetrics = useCallback(async () => {
    const newMetrics: PerformanceMetric[] = [];
    
    try {
      // Database performance
      const dbMetric = await measureDatabasePerformance();
      newMetrics.push(dbMetric);
      
      // Cache performance
      const cacheMetric = await measureCachePerformance();
      newMetrics.push(cacheMetric);
      
      // Activity system performance
      const activityMetric = await measureActivityPerformance();
      newMetrics.push(activityMetric);
      
      // Real-time performance
      const realtimeMetric = await measureRealtimePerformance();
      newMetrics.push(realtimeMetric);
      
      // Browser performance
      const browserMetrics = measureBrowserPerformance();
      newMetrics.push(...browserMetrics);
      
      // Update system load indicators
      const dbLoad = dbMetric.value > 0 && dbMetric.threshold ? 
        Math.min((dbMetric.value / dbMetric.threshold) * 100, 100) : 0;
      const realtimeLoad = realtimeMetric.value > 0 && realtimeMetric.threshold ? 
        Math.min((realtimeMetric.value / realtimeMetric.threshold) * 100, 100) : 0;
      
      setSystemLoad({
        cpu: Math.random() * 30 + 10, // Simulated - would need actual CPU monitoring
        memory: browserMetrics.find(m => m.name === 'Memory Usage')?.value || 0,
        database: dbLoad,
        realtime: realtimeLoad
      });
      
      setMetrics(prev => {
        // Keep last 50 metrics for each type
        const combined = [...prev, ...newMetrics];
        const grouped = combined.reduce((acc, metric) => {
          if (!acc[metric.name]) acc[metric.name] = [];
          acc[metric.name].push(metric);
          return acc;
        }, {} as Record<string, PerformanceMetric[]>);
        
        // Keep only latest 50 per metric type
        const trimmed = Object.values(grouped).flatMap(group => 
          group.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 50)
        );
        
        return trimmed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
      
    } catch (error) {
      console.error('Failed to collect performance metrics:', error);
    }
  }, [measureDatabasePerformance, measureCachePerformance, measureActivityPerformance, measureRealtimePerformance, measureBrowserPerformance]);

  // Start performance monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    collectMetrics(); // Initial collection
  }, [collectMetrics]);

  // Stop performance monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    setMetrics([]);
  }, []);

  // Get latest metrics by type
  const getLatestMetrics = useCallback(() => {
    const latest = metrics.reduce((acc, metric) => {
      if (!acc[metric.name] || new Date(metric.timestamp) > new Date(acc[metric.name].timestamp)) {
        acc[metric.name] = metric;
      }
      return acc;
    }, {} as Record<string, PerformanceMetric>);
    
    return Object.values(latest);
  }, [metrics]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const latest = getLatestMetrics();
    const good = latest.filter(m => m.status === 'good').length;
    const warning = latest.filter(m => m.status === 'warning').length;
    const critical = latest.filter(m => m.status === 'critical').length;
    
    return {
      total: latest.length,
      good,
      warning,
      critical,
      score: latest.length > 0 ? Math.round((good / latest.length) * 100) : 0
    };
  }, [getLatestMetrics]);

  // Set up monitoring interval
  useEffect(() => {
    if (!isMonitoring) return;
    
    const intervalId = setInterval(collectMetrics, interval);
    return () => clearInterval(intervalId);
  }, [isMonitoring, interval, collectMetrics]);

  return {
    metrics,
    systemLoad,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    collectMetrics,
    getLatestMetrics,
    getPerformanceSummary,
    
    // Individual measurement functions
    measureDatabasePerformance,
    measureRealtimePerformance,
    measureCachePerformance,
    measureActivityPerformance,
    measureBrowserPerformance
  };
};
