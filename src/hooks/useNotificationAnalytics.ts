import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { NotificationAnalytics, NotificationMetrics } from '@/services/notifications/notificationAnalytics';

/**
 * Hook to get notification metrics for the current user
 */
export function useNotificationMetrics(daysPeriod: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-metrics', user?.id, daysPeriod],
    queryFn: () => NotificationAnalytics.getUserMetrics(user?.id!, daysPeriod),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to get system-wide notification metrics (admin only)
 */
export function useSystemNotificationMetrics(daysPeriod: number = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['system-notification-metrics', daysPeriod],
    queryFn: () => NotificationAnalytics.getSystemMetrics(daysPeriod),
    enabled: !!user?.id && (user.role === 'AD' || user.role === 'SA'), // Only for admins
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to get notification performance by category
 */
export function useNotificationCategoryPerformance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-category-performance', user?.id],
    queryFn: () => NotificationAnalytics.getCategoryPerformance(user?.id),
    enabled: !!user?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to track notification engagement
 */
export function useTrackNotificationEngagement() {
  return {
    trackEngagement: NotificationAnalytics.trackEngagement,
  };
}

/**
 * Hook to get aggregated notification insights
 */
export function useNotificationInsights(daysPeriod: number = 30) {
  const metricsQuery = useNotificationMetrics(daysPeriod);
  const performanceQuery = useNotificationCategoryPerformance();

  return {
    metrics: metricsQuery.data,
    performance: performanceQuery.data,
    isLoading: metricsQuery.isLoading || performanceQuery.isLoading,
    error: metricsQuery.error || performanceQuery.error,
    refetch: () => {
      metricsQuery.refetch();
      performanceQuery.refetch();
    }
  };
}