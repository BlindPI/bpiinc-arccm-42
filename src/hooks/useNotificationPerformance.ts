import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  notificationPerformanceMonitor, 
  NotificationPerformanceMetrics 
} from '@/services/notifications/notificationPerformanceMonitor';

export function useNotificationPerformance(refreshInterval: number = 60000) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const queryClient = useQueryClient();

  // Performance metrics query
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics
  } = useQuery({
    queryKey: ['notificationPerformance', 'metrics'],
    queryFn: () => notificationPerformanceMonitor.getPerformanceMetrics(),
    refetchInterval: refreshInterval,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Queue status query
  const {
    data: queueStatus,
    isLoading: queueLoading,
    error: queueError,
    refetch: refetchQueue
  } = useQuery({
    queryKey: ['notificationPerformance', 'queue'],
    queryFn: () => notificationPerformanceMonitor.getQueueStatus(),
    refetchInterval: refreshInterval / 2, // More frequent updates for queue
    staleTime: 15000, // 15 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Detailed analytics query
  const {
    data: analytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useQuery({
    queryKey: ['notificationPerformance', 'analytics'],
    queryFn: () => notificationPerformanceMonitor.getDetailedAnalytics('day'),
    refetchInterval: refreshInterval * 2, // Less frequent for detailed analytics
    staleTime: 60000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  });

  // Start monitoring function
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    // Force refresh all queries
    refetchMetrics();
    refetchQueue();
    refetchAnalytics();
  }, [refetchMetrics, refetchQueue, refetchAnalytics]);

  // Stop monitoring function
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    // Cancel ongoing queries
    queryClient.cancelQueries({ queryKey: ['notificationPerformance'] });
  }, [queryClient]);

  // Retry failed notifications
  const retryFailedNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationPerformanceMonitor.retryFailedNotifications(notificationIds);
      // Refresh queue status after retry
      refetchQueue();
      return true;
    } catch (error) {
      console.error('Failed to retry notifications:', error);
      return false;
    }
  }, [refetchQueue]);

  // Log performance event
  const logEvent = useCallback(async (event: {
    type: 'NOTIFICATION_SENT' | 'NOTIFICATION_FAILED' | 'QUEUE_PROCESSED' | 'SYSTEM_ALERT';
    details: Record<string, any>;
  }) => {
    try {
      await notificationPerformanceMonitor.logPerformanceEvent(event);
      // Optionally refresh metrics after logging important events
      if (event.type === 'SYSTEM_ALERT') {
        refetchMetrics();
      }
    } catch (error) {
      console.error('Failed to log performance event:', error);
    }
  }, [refetchMetrics]);

  // Force refresh all data
  const refreshAll = useCallback(() => {
    refetchMetrics();
    refetchQueue();
    refetchAnalytics();
  }, [refetchMetrics, refetchQueue, refetchAnalytics]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  // System health check based on metrics
  const systemHealth = useCallback(() => {
    if (!metrics) return 'UNKNOWN';
    
    const { systemLoad, errorRate, queueLength } = metrics;
    
    if (systemLoad === 'CRITICAL' || errorRate > 15 || queueLength > 1000) {
      return 'CRITICAL';
    } else if (systemLoad === 'HIGH' || errorRate > 8 || queueLength > 500) {
      return 'WARNING';
    } else if (systemLoad === 'MEDIUM' || errorRate > 3 || queueLength > 100) {
      return 'MODERATE';
    } else {
      return 'HEALTHY';
    }
  }, [metrics]);

  // Get actionable alerts
  const getAlerts = useCallback(() => {
    const alerts: Array<{
      type: 'ERROR' | 'WARNING' | 'INFO';
      message: string;
      action?: string;
    }> = [];

    if (metrics) {
      if (metrics.errorRate > 10) {
        alerts.push({
          type: 'ERROR',
          message: `High error rate: ${metrics.errorRate.toFixed(1)}%`,
          action: 'Check notification sending logic and database connectivity'
        });
      }

      if (metrics.queueLength > 500) {
        alerts.push({
          type: 'WARNING',
          message: `Large queue backlog: ${metrics.queueLength} notifications`,
          action: 'Consider increasing processing capacity or batch processing'
        });
      }

      if (metrics.avgProcessingTime > 10) {
        alerts.push({
          type: 'WARNING',
          message: `Slow processing: ${metrics.avgProcessingTime}s average`,
          action: 'Optimize database queries and add indexing'
        });
      }
    }

    if (queueStatus && queueStatus.failed > 50) {
      alerts.push({
        type: 'ERROR',
        message: `Many failed notifications: ${queueStatus.failed}`,
        action: 'Review error logs and retry failed notifications'
      });
    }

    return alerts;
  }, [metrics, queueStatus]);

  return {
    // Data
    metrics,
    queueStatus,
    analytics,
    
    // Loading states
    isLoading: metricsLoading || queueLoading || analyticsLoading,
    metricsLoading,
    queueLoading,
    analyticsLoading,
    
    // Error states
    error: metricsError || queueError || analyticsError,
    metricsError,
    queueError,
    analyticsError,
    
    // Monitoring state
    isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    refreshAll,
    retryFailedNotifications,
    logEvent,
    
    // Computed values
    systemHealth: systemHealth(),
    alerts: getAlerts(),
    
    // Quick stats
    totalNotifications: metrics?.totalNotifications || 0,
    successRate: metrics?.successRate || 0,
    currentQueueLength: queueStatus?.pending || 0,
    failedCount: queueStatus?.failed || 0
  };
}

// Specialized hook for queue monitoring only
export function useNotificationQueue(refreshInterval: number = 30000) {
  const {
    data: queueStatus,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notificationQueue'],
    queryFn: () => notificationPerformanceMonitor.getQueueStatus(),
    refetchInterval: refreshInterval,
    staleTime: 10000, // 10 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    retry: 2
  });

  const retryFailedNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      await notificationPerformanceMonitor.retryFailedNotifications(notificationIds);
      refetch();
      return true;
    } catch (error) {
      console.error('Failed to retry notifications:', error);
      return false;
    }
  }, [refetch]);

  return {
    queueStatus,
    isLoading,
    error,
    refresh: refetch,
    retryFailedNotifications,
    
    // Quick access to common values
    pending: queueStatus?.pending || 0,
    processing: queueStatus?.processing || 0,
    failed: queueStatus?.failed || 0,
    scheduled: queueStatus?.scheduled || 0,
    items: queueStatus?.items || []
  };
}

// Hook for system administrators to monitor overall system health
export function useNotificationSystemHealth() {
  const { metrics, queueStatus, isLoading, error, refreshAll } = useNotificationPerformance(30000);

  const overallHealth = useCallback(() => {
    if (!metrics || !queueStatus) return 'UNKNOWN';

    const issues = [];
    
    if (metrics.errorRate > 20) issues.push('CRITICAL_ERROR_RATE');
    if (metrics.queueLength > 1000) issues.push('CRITICAL_QUEUE_SIZE');
    if (metrics.avgProcessingTime > 30) issues.push('CRITICAL_PERFORMANCE');
    if (queueStatus.failed > 100) issues.push('HIGH_FAILURE_COUNT');

    if (issues.length > 0) return 'CRITICAL';
    
    if (metrics.errorRate > 10 || metrics.queueLength > 500 || queueStatus.failed > 50) {
      return 'WARNING';
    }

    return 'HEALTHY';
  }, [metrics, queueStatus]);

  const getSystemReport = useCallback(() => {
    if (!metrics || !queueStatus) return null;

    return {
      timestamp: new Date().toISOString(),
      health: overallHealth(),
      metrics: {
        totalNotifications: metrics.totalNotifications,
        successRate: metrics.successRate,
        errorRate: metrics.errorRate,
        avgProcessingTime: metrics.avgProcessingTime,
        systemLoad: metrics.systemLoad
      },
      queue: {
        pending: queueStatus.pending,
        processing: queueStatus.processing,
        failed: queueStatus.failed,
        scheduled: queueStatus.scheduled
      },
      recommendations: metrics.recommendations
    };
  }, [metrics, queueStatus, overallHealth]);

  return {
    health: overallHealth(),
    report: getSystemReport(),
    isLoading,
    error,
    refresh: refreshAll,
    metrics,
    queueStatus
  };
}