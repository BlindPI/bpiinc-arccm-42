import { useState, useEffect } from 'react';
import { CertificateMetricsService, CertificateMetrics, NavigationStats } from '@/services/certificates/certificateMetricsService';
import { useProfile } from '@/hooks/useProfile';

interface UseCertificateMetricsOptions {
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface UseCertificateMetricsReturn {
  metrics: CertificateMetrics | null;
  navigationStats: NavigationStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage certificate metrics data
 * @param canManageRequests - Whether the user has admin privileges
 * @param options - Configuration options for the hook
 */
export const useCertificateMetrics = (
  canManageRequests: boolean,
  options: UseCertificateMetricsOptions = {}
): UseCertificateMetricsReturn => {
  const { data: profile } = useProfile();
  const { autoFetch = true, refreshInterval } = options;

  const [metrics, setMetrics] = useState<CertificateMetrics | null>(null);
  const [navigationStats, setNavigationStats] = useState<NavigationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    if (!profile?.id) {
      console.log('Profile not loaded yet, skipping metrics fetch');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching certificate metrics for user:', profile.id, 'isAdmin:', canManageRequests);
      
      // Fetch both dashboard metrics and navigation stats in parallel
      const [dashboardMetrics, navStats] = await Promise.all([
        CertificateMetricsService.getDashboardMetrics(profile.id, canManageRequests),
        CertificateMetricsService.getNavigationStats(profile.id, canManageRequests)
      ]);

      setMetrics(dashboardMetrics);
      setNavigationStats(navStats);
      
      console.log('Certificate metrics loaded successfully:', {
        dashboardMetrics,
        navStats
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch certificate metrics';
      console.error('Error fetching certificate metrics:', err);
      setError(errorMessage);
      
      // Set default values on error to prevent UI crashes
      setMetrics({
        totalCertificates: 0,
        pendingRequests: 0,
        completionRate: 0,
        recentActivity: 0,
        archivedRequests: 0,
        recentUploads: 0,
        activeRosters: 0
      });
      setNavigationStats({
        totalCertificates: 0,
        pendingRequests: 0,
        recentActivity: 0,
        archivedRequests: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && profile?.id) {
      fetchMetrics();
    }
  }, [profile?.id, canManageRequests, autoFetch]);

  // Set up refresh interval if specified
  useEffect(() => {
    if (!refreshInterval || !autoFetch) {
      return;
    }

    const interval = setInterval(() => {
      if (profile?.id) {
        fetchMetrics();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, autoFetch, profile?.id, canManageRequests]);

  return {
    metrics,
    navigationStats,
    isLoading,
    error,
    refetch: fetchMetrics
  };
};

/**
 * Hook specifically for dashboard metrics
 */
export const useDashboardMetrics = (canManageRequests: boolean) => {
  const { metrics, isLoading, error, refetch } = useCertificateMetrics(canManageRequests, {
    autoFetch: true,
    refreshInterval: 30000 // Refresh every 30 seconds
  });

  return {
    metrics,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook specifically for navigation card stats
 */
export const useNavigationStats = (canManageRequests: boolean) => {
  const { navigationStats, isLoading, error, refetch } = useCertificateMetrics(canManageRequests, {
    autoFetch: true,
    refreshInterval: 60000 // Refresh every minute
  });

  return {
    stats: navigationStats,
    isLoading,
    error,
    refetch
  };
};

/**
 * Hook for manual metrics fetching (no auto-refresh)
 */
export const useCertificateMetricsManual = (canManageRequests: boolean) => {
  return useCertificateMetrics(canManageRequests, {
    autoFetch: false
  });
};