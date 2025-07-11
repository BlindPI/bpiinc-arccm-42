import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { syncStatusService } from '@/services/enrollment/syncStatusService';
import type { 
  EnrollmentSyncStatus, 
  EnrollmentSyncLog,
  EnrollmentWithThinkific 
} from '@/types/enrollment';

// Hook for tracking sync statuses of multiple enrollments
export function useSyncStatusTracking(enrollmentIds: string[]) {
  return useQuery({
    queryKey: ['sync-statuses', enrollmentIds],
    queryFn: () => syncStatusService.getSyncStatuses(enrollmentIds),
    enabled: enrollmentIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// Hook for updating sync status
export function useUpdateSyncStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: syncStatusService.updateSyncStatus.bind(syncStatusService),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['sync-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['enrollment-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['sync-health-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs', variables.enrollmentId] });
      
      toast.success('Sync status updated successfully');
    },
    onError: (error) => {
      console.error('Error updating sync status:', error);
      toast.error('Failed to update sync status');
    }
  });
}

// Hook for getting failed enrollments that need retry
export function useFailedEnrollments() {
  return useQuery({
    queryKey: ['failed-enrollments'],
    queryFn: () => syncStatusService.getFailedEnrollments(),
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for resetting sync status for retry
export function useResetSyncStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (enrollmentIds: string[]) => syncStatusService.resetSyncStatus(enrollmentIds),
    onSuccess: (_, enrollmentIds) => {
      queryClient.invalidateQueries({ queryKey: ['sync-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['failed-enrollments'] });
      
      toast.success(`Reset sync status for ${enrollmentIds.length} enrollment(s)`);
    },
    onError: (error) => {
      console.error('Error resetting sync status:', error);
      toast.error('Failed to reset sync status');
    }
  });
}

// Hook for getting sync logs for an enrollment
export function useSyncLogs(enrollmentId: string, limit: number = 50) {
  return useQuery({
    queryKey: ['sync-logs', enrollmentId, limit],
    queryFn: () => syncStatusService.getSyncLogs(enrollmentId, limit),
    enabled: !!enrollmentId,
  });
}

// Hook for sync health metrics
export function useSyncHealthMetrics() {
  return useQuery({
    queryKey: ['sync-health-metrics'],
    queryFn: () => syncStatusService.getSyncHealthMetrics(),
    refetchInterval: 2 * 60 * 1000, // 2 minutes
  });
}

// Hook for handling sync errors with retry logic
export function useHandleSyncError() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      enrollmentId, 
      error, 
      retryConfig 
    }: { 
      enrollmentId: string; 
      error: Error; 
      retryConfig?: { maxRetries?: number; retryDelay?: number; exponentialBackoff?: boolean; };
    }) => syncStatusService.handleSyncError(enrollmentId, error, retryConfig),
    onSuccess: (willRetry, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sync-statuses'] });
      queryClient.invalidateQueries({ queryKey: ['failed-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs', variables.enrollmentId] });
      
      if (willRetry) {
        toast.info('Sync error logged. Will retry automatically.');
      } else {
        toast.error('Max retries exceeded. Manual intervention required.');
      }
    },
    onError: (error) => {
      console.error('Error handling sync error:', error);
      toast.error('Failed to handle sync error');
    }
  });
}

// Enhanced hook for real-time sync status monitoring
export function useSyncStatusMonitor(enrollmentIds: string[], options?: {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onStatusChange?: (enrollmentId: string, newStatus: EnrollmentSyncStatus) => void;
}) {
  const { autoRefresh = true, refreshInterval = 30000, onStatusChange } = options || {};
  
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: ['sync-status-monitor', enrollmentIds],
    queryFn: () => syncStatusService.getSyncStatuses(enrollmentIds),
    enabled: enrollmentIds.length > 0 && autoRefresh,
    refetchInterval: refreshInterval,
    onSuccess: (newStatuses) => {
      // Check for status changes and trigger callback
      if (onStatusChange) {
        Object.entries(newStatuses).forEach(([enrollmentId, status]) => {
          // Get previous status from cache
          const previousData = queryClient.getQueryData<Record<string, EnrollmentSyncStatus>>([
            'sync-status-monitor', 
            enrollmentIds
          ]);
          
          if (previousData && previousData[enrollmentId] !== status) {
            onStatusChange(enrollmentId, status);
          }
        });
      }
    }
  });

  // Manual refresh function
  const refresh = () => {
    query.refetch();
  };

  // Stop monitoring function
  const stopMonitoring = () => {
    queryClient.cancelQueries({ queryKey: ['sync-status-monitor', enrollmentIds] });
  };

  return {
    ...query,
    refresh,
    stopMonitoring,
    isMonitoring: autoRefresh && !query.isPaused
  };
}

// Hook for batch sync error recovery
export function useBatchSyncErrorRecovery() {
  const queryClient = useQueryClient();
  const resetSyncStatus = useResetSyncStatus();

  const recoverFailedSyncs = useMutation({
    mutationFn: async (options?: { 
      autoRetryOnly?: boolean; 
      maxAge?: number; // hours
    }) => {
      const { autoRetryOnly = true, maxAge = 24 } = options || {};
      
      // Get failed enrollments
      const failedEnrollments = await syncStatusService.getFailedEnrollments();
      
      // Filter by age if specified
      const cutoffDate = new Date(Date.now() - (maxAge * 60 * 60 * 1000));
      const eligibleEnrollments = failedEnrollments.filter(enrollment => {
        if (!enrollment.last_thinkific_sync) return true;
        return new Date(enrollment.last_thinkific_sync) > cutoffDate;
      });

      // Reset sync status for eligible enrollments
      const enrollmentIds = eligibleEnrollments.map(e => e.id);
      if (enrollmentIds.length > 0) {
        await syncStatusService.resetSyncStatus(enrollmentIds);
      }

      return {
        total: failedEnrollments.length,
        recovered: enrollmentIds.length,
        skipped: failedEnrollments.length - enrollmentIds.length
      };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['failed-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sync-statuses'] });
      
      toast.success(
        `Recovered ${result.recovered} failed syncs. ${result.skipped} skipped due to age.`
      );
    },
    onError: (error) => {
      console.error('Error recovering failed syncs:', error);
      toast.error('Failed to recover failed syncs');
    }
  });

  return {
    recoverFailedSyncs: recoverFailedSyncs.mutate,
    isRecovering: recoverFailedSyncs.isPending,
    error: recoverFailedSyncs.error
  };
}

// Utility hook for sync status display
export function useSyncStatusDisplay(enrollmentId: string) {
  const { data: statuses } = useSyncStatusTracking([enrollmentId]);
  const { data: logs } = useSyncLogs(enrollmentId, 10);
  
  const status = statuses?.[enrollmentId] || 'PENDING';
  const lastLog = logs?.[0];
  
  const getStatusColor = (status: EnrollmentSyncStatus) => {
    switch (status) {
      case 'SYNCED': return 'success';
      case 'PENDING': return 'secondary';
      case 'ERROR': return 'destructive';
      case 'NOT_FOUND': return 'destructive';
      case 'MANUAL_REVIEW': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: EnrollmentSyncStatus) => {
    switch (status) {
      case 'SYNCED': return 'Synced';
      case 'PENDING': return 'Pending';
      case 'ERROR': return 'Error';
      case 'NOT_FOUND': return 'Not Found';
      case 'MANUAL_REVIEW': return 'Review Needed';
      default: return 'Unknown';
    }
  };

  return {
    status,
    statusColor: getStatusColor(status),
    statusText: getStatusText(status),
    lastLog,
    hasError: status === 'ERROR' || status === 'NOT_FOUND',
    needsReview: status === 'MANUAL_REVIEW'
  };
}