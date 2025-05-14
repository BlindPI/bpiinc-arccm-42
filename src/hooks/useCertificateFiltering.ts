import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { fetchCertificates } from '@/services/certificates/certificateFetchService';
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
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'issue_date',
    direction: 'desc'
  });
  
  // For keeping track of unique batches/rosters
  const [batches, setBatches] = useState<BatchInfo[]>([]);

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
    
    const loadCertificates = async () => {
      setIsLoading(true);
      
      const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
      
      try {
        const result = await fetchCertificates({
          profileId: profile.id,
          isAdmin,  // Pass the isAdmin flag to properly handle admin access
          filters,
          sortColumn: sortConfig.column,
          sortDirection: sortConfig.direction
        });
        
        if (isMounted) {
          setCertificates(result.certificates);
          setBatches(result.batches);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          handleError(err);
          setIsLoading(false);
        }
      }
    };

    loadCertificates();
    
    return () => {
      isMounted = false;
    };
  }, [profile?.id, profile?.role, refetchTrigger, filters, sortConfig, handleError, clearError]);

  // Expose refetch method with proper implementation
  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
    // Also invalidate related queries to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['certificates'] });
  }, [queryClient]);

  return {
    certificates,
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
