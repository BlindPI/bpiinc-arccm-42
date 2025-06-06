import { useState, useEffect, useCallback } from 'react';
import { realTimeMetricsService } from '@/services/monitoring';
import type { MetricAggregation } from '@/services/monitoring';

export interface TrendData {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

export interface UseRealTimeTrendsReturn {
  trends: Record<string, TrendData>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export const useRealTimeTrends = (
  metrics: string[] = ['uptime', 'response_time', 'error_rate', 'active_users'],
  period: 'minute' | 'hour' | 'day' = 'hour',
  autoRefresh: boolean = true,
  interval: number = 60000 // 1 minute
) => {
  const [trends, setTrends] = useState<Record<string, TrendData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const calculateTrend = useCallback(async (metric: string): Promise<TrendData | null> => {
    try {
      const now = new Date();
      const periodMs = period === 'minute' ? 60000 : period === 'hour' ? 3600000 : 86400000;
      
      // Get current period data
      const currentPeriodStart = new Date(now.getTime() - periodMs);
      const currentAggregations = await realTimeMetricsService.getMetricAggregations(
        metric,
        period,
        'avg',
        {
          start: currentPeriodStart.toISOString(),
          end: now.toISOString()
        }
      );

      // Get previous period data for comparison
      const previousPeriodStart = new Date(now.getTime() - (2 * periodMs));
      const previousPeriodEnd = new Date(now.getTime() - periodMs);
      const previousAggregations = await realTimeMetricsService.getMetricAggregations(
        metric,
        period,
        'avg',
        {
          start: previousPeriodStart.toISOString(),
          end: previousPeriodEnd.toISOString()
        }
      );

      if (currentAggregations.length === 0 && previousAggregations.length === 0) {
        return null;
      }

      // Calculate averages
      const currentValue = currentAggregations.length > 0 
        ? currentAggregations.reduce((sum, agg) => sum + agg.value, 0) / currentAggregations.length
        : 0;

      const previousValue = previousAggregations.length > 0
        ? previousAggregations.reduce((sum, agg) => sum + agg.value, 0) / previousAggregations.length
        : currentValue;

      const change = currentValue - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(changePercent) > 1) { // Only consider significant changes
        trend = changePercent > 0 ? 'up' : 'down';
      }

      // Determine unit based on metric
      const getUnit = (metricName: string): string => {
        switch (metricName) {
          case 'uptime': return '%';
          case 'response_time': return 'ms';
          case 'error_rate': return '%';
          case 'active_users': return 'users';
          case 'system_load': return '%';
          case 'memory_usage': return '%';
          case 'disk_usage': return '%';
          default: return '';
        }
      };

      return {
        metric,
        current: Number(currentValue.toFixed(2)),
        previous: Number(previousValue.toFixed(2)),
        change: Number(change.toFixed(2)),
        changePercent: Number(changePercent.toFixed(1)),
        trend,
        unit: getUnit(metric)
      };
    } catch (err) {
      console.error(`Error calculating trend for ${metric}:`, err);
      return null;
    }
  }, [period]);

  const fetchTrends = useCallback(async () => {
    try {
      setError(null);
      const trendPromises = metrics.map(metric => calculateTrend(metric));
      const trendResults = await Promise.all(trendPromises);
      
      const newTrends: Record<string, TrendData> = {};
      trendResults.forEach((trend, index) => {
        if (trend) {
          newTrends[metrics[index]] = trend;
        }
      });

      setTrends(newTrends);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  }, [metrics, calculateTrend]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(fetchTrends, interval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, interval, fetchTrends]);

  return {
    trends,
    loading,
    error,
    lastUpdated,
    refresh
  };
};

// Helper function to format trend display
export const formatTrendChange = (trend: TrendData): string => {
  const sign = trend.changePercent >= 0 ? '+' : '';
  return `${sign}${trend.changePercent}%`;
};

// Helper function to get trend color
export const getTrendColor = (trend: TrendData, metricType: 'higher_better' | 'lower_better' = 'higher_better'): string => {
  if (trend.trend === 'stable') return 'text-gray-500';
  
  const isPositive = trend.changePercent > 0;
  
  if (metricType === 'higher_better') {
    return isPositive ? 'text-green-600' : 'text-red-600';
  } else {
    return isPositive ? 'text-red-600' : 'text-green-600';
  }
};

export default useRealTimeTrends;