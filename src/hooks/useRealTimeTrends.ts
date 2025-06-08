
import { useQuery } from '@tanstack/react-query';
import { realTimeMetricsService } from '@/services/monitoring/realTimeMetricsService';

export const useRealTimeTrends = (metricName: string) => {
  const { data: hourlyData, isLoading: hourlyLoading } = useQuery({
    queryKey: ['metric-aggregation', metricName, 'hour'],
    queryFn: () => realTimeMetricsService.getMetricAggregation(metricName, 'hour'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['metric-aggregation', metricName, 'day'],
    queryFn: () => realTimeMetricsService.getMetricAggregation(metricName, 'day'),
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: ['metric-aggregation', metricName, 'week'],
    queryFn: () => realTimeMetricsService.getMetricAggregation(metricName, 'week'),
    refetchInterval: 600000, // Refresh every 10 minutes
  });

  return {
    hourlyData,
    dailyData,
    weeklyData,
    isLoading: hourlyLoading || dailyLoading || weeklyLoading,
    trends: {
      hourly: hourlyData?.avg || 0,
      daily: dailyData?.avg || 0,
      weekly: weeklyData?.avg || 0,
    }
  };
};

export const useMetricHistory = (metricName: string, period: 'hour' | 'day' | 'week' = 'hour') => {
  return useQuery({
    queryKey: ['metric-history', metricName, period],
    queryFn: () => realTimeMetricsService.getMetricHistory(metricName, period),
    refetchInterval: period === 'hour' ? 30000 : 300000,
  });
};

export const useSystemMetrics = () => {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: async () => {
      const [uptime, responseTime, errorRate] = await Promise.all([
        realTimeMetricsService.getMetricAggregation('uptime', 'hour'),
        realTimeMetricsService.getMetricAggregation('response_time', 'hour'),
        realTimeMetricsService.getMetricAggregation('error_rate', 'hour'),
      ]);

      return {
        uptime: uptime?.avg || 0,
        responseTime: responseTime?.avg || 0,
        errorRate: errorRate?.avg || 0,
      };
    },
    refetchInterval: 30000,
  });
};
