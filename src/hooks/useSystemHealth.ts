
import { useQuery } from '@tanstack/react-query';
import { systemHealthService } from '@/services/monitoring/systemHealthService';
import type { SystemHealthMetrics } from '@/services/monitoring/realTimeMetricsService';

export const useSystemHealth = () => {
  const { data: healthMetrics, isLoading: loading, error } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => systemHealthService.getSystemHealth(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return {
    healthMetrics,
    loading,
    error,
    isHealthy: healthMetrics ? 
      healthMetrics.uptime > 95 && 
      healthMetrics.errorRate < 5 && 
      healthMetrics.responseTime < 2000 
      : false
  };
};

export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['system-metrics-overview'],
    queryFn: async () => {
      const health = await systemHealthService.getSystemHealth();
      return {
        uptime: health.uptime,
        responseTime: health.responseTime,
        errorRate: health.errorRate,
        activeUsers: health.activeUsers,
        systemLoad: health.systemLoad,
        memoryUsage: health.memoryUsage,
        diskUsage: health.diskUsage,
        databaseConnections: health.databaseConnections,
        lastUpdated: health.lastUpdated
      };
    },
    refetchInterval: 60000, // Refresh every minute
  });
};
