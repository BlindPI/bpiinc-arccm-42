import { useState, useEffect, useCallback } from 'react';
import { systemHealthService, realTimeMetricsService } from '@/services/monitoring';
import type { SystemHealthMetrics } from '@/services/monitoring';

export interface UseSystemHealthReturn {
  healthMetrics: SystemHealthMetrics | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useSystemHealth = (autoRefresh: boolean = true, interval: number = 30000) => {
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchHealthMetrics = useCallback(async () => {
    try {
      setError(null);
      const metrics = await systemHealthService.getSystemHealth();
      setHealthMetrics(metrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchHealthMetrics();
  }, [fetchHealthMetrics]);

  useEffect(() => {
    fetchHealthMetrics();
  }, [fetchHealthMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchHealthMetrics, interval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchHealthMetrics]);

  // Record metrics for real-time monitoring
  useEffect(() => {
    if (healthMetrics) {
      // Record key metrics
      realTimeMetricsService.recordMetric('uptime', healthMetrics.uptime, 'percentage', 'system');
      realTimeMetricsService.recordMetric('response_time', healthMetrics.responseTime, 'milliseconds', 'performance');
      realTimeMetricsService.recordMetric('error_rate', healthMetrics.errorRate, 'percentage', 'system');
      realTimeMetricsService.recordMetric('active_users', healthMetrics.activeUsers, 'count', 'user');
      realTimeMetricsService.recordMetric('system_load', healthMetrics.systemLoad, 'percentage', 'performance');
    }
  }, [healthMetrics]);

  return {
    healthMetrics,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

export default useSystemHealth;
