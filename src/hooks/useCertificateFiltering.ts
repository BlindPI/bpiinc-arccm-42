
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { fetchCertificates } from '@/services/certificates/simpleCertificateService';
import { 
  SortColumn, 
  SortDirection, 
  DateRange, 
  CertificateFilters,
  UseCertificateFilteringProps,
  UseCertificateFilteringResult,
  BatchInfo,
  SortConfig
} from '@/types/certificateFilters';
import { useQueryClient } from '@tanstack/react-query';
import { useErrorHandler } from '@/hooks/use-error-handler';

// Re-export types needed by components
export type { 
  SortColumn, 
  SortDirection, 
  DateRange, 
  CertificateFilters 
};

// Debounce helper function
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useCertificateFiltering({ 
  initialFilters 
}: UseCertificateFilteringProps = {}): UseCertificateFilteringResult {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { error, handleError, clearError } = useErrorHandler();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  
  const [filters, setFilters] = useState<CertificateFilters>(initialFilters || {
    courseId: 'all',
    status: 'all',
    dateRange: {},
    batchId: null
  });

  // Debounce filters to prevent rapid re-fetching
  const debouncedFilters = useDebounce(filters);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'issue_date',
    direction: 'desc'
  });
  
  // For keeping track of unique batches/rosters
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  
  // Create a memoized version of certificates to prevent unnecessary re-renders
  const memoizedCertificates = useMemo(() => certificates, [certificates]);

  // Handle sorting - with no dependencies to avoid circularity
  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig(prevConfig => ({
      column,
      direction: prevConfig.column === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    // Trigger a refetch whenever sort changes
    setRefetchTrigger(prev => prev + 1);
  }, []);
  
  // Reset filters to defaults - with no dependencies
  const resetFilters = useCallback(() => {
    setFilters({
      courseId: 'all',
      status: 'all',
      dateRange: {},
      batchId: null
    });
    // Trigger a refetch when filters are reset
    setRefetchTrigger(prev => prev + 1);
  }, []);

  // Load certificates when profile changes or refetch is triggered
  useEffect(() => {
    if (!profile?.id) return;
    
    let isMounted = true;
    clearError();
    setIsLoading(true);
    
    const loadCertificates = async () => {
      try {
        console.log('Fetching certificates with params:', {
          profileId: profile.id,
          isAdmin: profile?.role && ['SA', 'AD'].includes(profile.role),
          filters: debouncedFilters,
          sortConfig
        });
        
        // Determine if user is admin
        const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
        
        // Safely convert date objects to strings for the query
        const fromDate = debouncedFilters.dateRange?.from ? 
          debouncedFilters.dateRange.from.toISOString().split('T')[0] : undefined;
          
        const toDate = debouncedFilters.dateRange?.to ? 
          debouncedFilters.dateRange.to.toISOString().split('T')[0] : undefined;
        
        // Use the simplified service
        const result = await fetchCertificates({
          profileId: profile.id,
          isAdmin,
          courseId: debouncedFilters.courseId || 'all',
          status: debouncedFilters.status || 'all',
          batchId: debouncedFilters.batchId || undefined,
          fromDate,
          toDate,
          sortColumn: sortConfig.column,
          sortDirection: sortConfig.direction
        });
        
        if (isMounted) {
          setCertificates(result.certificates || []);
          setBatches(result.batches || []);
          
          if (result.error) {
            handleError(result.error);
          }
          
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error in certificate filtering:', err);
          handleError(err);
          setIsLoading(false);
        }
      }
    };

    // Use a small timeout to prevent rapid consecutive calls
    const timeoutId = setTimeout(() => {
      loadCertificates();
    }, 50);
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [profile?.id, profile?.role, refetchTrigger, debouncedFilters, sortConfig, handleError, clearError]);

  // Expose refetch method with proper implementation
  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
    // Also invalidate related queries to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['certificates'] });
  }, [queryClient]);

  return {
    certificates: memoizedCertificates,
    isLoading,
    error,
    filters,
    setFilters,
    sortConfig,
    handleSort,
    resetFilters,
    batches,
    refetch
  };
}
