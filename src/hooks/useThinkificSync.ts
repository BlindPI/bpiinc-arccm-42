import { useState, useEffect, useCallback } from 'react';
import { ThinkificSyncService, SyncProgress } from '@/services/enrollment/thinkificSyncService';
import type { 
  ThinkificSyncResult, 
  ThinkificCourseMapping, 
  EnrollmentWithThinkific,
  ThinkificSyncStatus 
} from '@/types/enrollment';

interface UseThinkificSyncOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseThinkificSyncReturn {
  syncEnrollment: (enrollmentId: string) => Promise<ThinkificSyncResult>;
  syncEnrollments: (enrollmentIds: string[]) => Promise<ThinkificSyncResult[]>;
  syncCourseEnrollments: (courseOfferingId: string) => Promise<ThinkificSyncResult[]>;
  isLoading: boolean;
  error: string | null;
  progress: SyncProgress | null;
  clearError: () => void;
}

/**
 * Hook for managing Thinkific sync operations
 */
export const useThinkificSync = (
  options: UseThinkificSyncOptions = {}
): UseThinkificSyncReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncEnrollment = useCallback(async (enrollmentId: string): Promise<ThinkificSyncResult> => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      const result = await ThinkificSyncService.syncEnrollment(enrollmentId);
      
      if (!result.success) {
        setError(result.error || 'Sync failed');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync enrollment';
      setError(errorMessage);
      return {
        success: false,
        enrollment_id: enrollmentId,
        error: errorMessage,
        sync_duration_ms: 0
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncEnrollments = useCallback(async (enrollmentIds: string[]): Promise<ThinkificSyncResult[]> => {
    setIsLoading(true);
    setError(null);
    setProgress({ total: enrollmentIds.length, completed: 0, failed: 0 });

    try {
      const results = await ThinkificSyncService.syncEnrollments(
        enrollmentIds,
        {},
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        setError(`${failedResults.length} of ${results.length} syncs failed`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync enrollments';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const syncCourseEnrollments = useCallback(async (courseOfferingId: string): Promise<ThinkificSyncResult[]> => {
    setIsLoading(true);
    setError(null);
    setProgress(null);

    try {
      const results = await ThinkificSyncService.syncCourseEnrollments(
        courseOfferingId,
        {},
        (progressUpdate) => {
          setProgress(progressUpdate);
        }
      );

      const failedResults = results.filter(r => !r.success);
      if (failedResults.length > 0) {
        setError(`${failedResults.length} of ${results.length} syncs failed`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync course enrollments';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    syncEnrollment,
    syncEnrollments,
    syncCourseEnrollments,
    isLoading,
    error,
    progress,
    clearError
  };
};

interface UseEnrollmentWithSyncReturn {
  enrollments: EnrollmentWithThinkific[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  syncStatistics: {
    totalEnrollments: number;
    syncedEnrollments: number;
    failedSyncs: number;
    pendingSyncs: number;
    lastSyncDate?: string;
  } | null;
}

/**
 * Hook for fetching enrollments with Thinkific sync status
 */
export const useEnrollmentWithSync = (
  filters: {
    courseOfferingId?: string;
    syncStatus?: ThinkificSyncStatus;
    limit?: number;
  } = {},
  options: UseThinkificSyncOptions = {}
): UseEnrollmentWithSyncReturn => {
  const { autoFetch = true, refreshInterval } = options;
  
  const [enrollments, setEnrollments] = useState<EnrollmentWithThinkific[]>([]);
  const [syncStatistics, setSyncStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [enrollmentsData, statsData] = await Promise.all([
        ThinkificSyncService.getEnrollmentsWithSyncStatus(filters),
        ThinkificSyncService.getSyncStatistics()
      ]);

      setEnrollments(enrollmentsData);
      setSyncStatistics(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollment data';
      setError(errorMessage);
      setEnrollments([]);
      setSyncStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters.courseOfferingId, filters.syncStatus, filters.limit]);

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !autoFetch) {
      return;
    }

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, autoFetch, fetchData]);

  return {
    enrollments,
    isLoading,
    error,
    refetch: fetchData,
    syncStatistics
  };
};

interface UseCourseMappingsReturn {
  mappings: ThinkificCourseMapping[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateMapping: (mapping: Partial<ThinkificCourseMapping>) => Promise<void>;
}

/**
 * Hook for managing Thinkific course mappings
 */
export const useCourseMappings = (
  options: UseThinkificSyncOptions = {}
): UseCourseMappingsReturn => {
  const { autoFetch = true, refreshInterval } = options;
  
  const [mappings, setMappings] = useState<ThinkificCourseMapping[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMappings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const mappingsData = await ThinkificSyncService.getCourseMappings();
      setMappings(mappingsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course mappings';
      setError(errorMessage);
      setMappings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMapping = useCallback(async (mapping: Partial<ThinkificCourseMapping>) => {
    try {
      await ThinkificSyncService.updateCourseMapping(mapping);
      await fetchMappings(); // Refresh the list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course mapping';
      setError(errorMessage);
      throw err;
    }
  }, [fetchMappings]);

  // Initial fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchMappings();
    }
  }, [autoFetch, fetchMappings]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !autoFetch) {
      return;
    }

    const interval = setInterval(fetchMappings, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, autoFetch, fetchMappings]);

  return {
    mappings,
    isLoading,
    error,
    refetch: fetchMappings,
    updateMapping
  };
};

/**
 * Hook for sync statistics dashboard
 */
export const useSyncStatistics = (refreshInterval: number = 30000) => {
  const [statistics, setStatistics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await ThinkificSyncService.getSyncStatistics();
      setStatistics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch sync statistics';
      setError(errorMessage);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  useEffect(() => {
    const interval = setInterval(fetchStatistics, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStatistics, refreshInterval]);

  return {
    statistics,
    isLoading,
    error,
    refetch: fetchStatistics
  };
};

/**
 * Hook for batch sync operations with progress tracking
 */
export const useBatchSync = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [results, setResults] = useState<ThinkificSyncResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startBatchSync = useCallback(async (enrollmentIds: string[]) => {
    console.log('🎯 BATCH SYNC HOOK TRIGGERED');
    console.log('Enrollment IDs to sync:', enrollmentIds);
    
    setIsRunning(true);
    setError(null);
    setResults([]);
    setProgress({ total: enrollmentIds.length, completed: 0, failed: 0 });

    try {
      console.log('🚀 Starting batch sync through service...');
      const batchResults = await ThinkificSyncService.syncEnrollments(
        enrollmentIds,
        { batchSize: 5 },
        (progressUpdate) => {
          console.log('📊 Progress update:', progressUpdate);
          setProgress(progressUpdate);
        }
      );

      setResults(batchResults);
      
      const failedCount = batchResults.filter(r => !r.success).length;
      if (failedCount > 0) {
        setError(`${failedCount} of ${batchResults.length} syncs failed`);
      }

      return batchResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch sync failed';
      setError(errorMessage);
      return [];
    } finally {
      setIsRunning(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setProgress(null);
    setResults([]);
    setError(null);
  }, []);

  return {
    startBatchSync,
    isRunning,
    progress,
    results,
    error,
    reset
  };
};