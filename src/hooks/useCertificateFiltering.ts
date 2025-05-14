
import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { fetchCertificates } from '@/services/certificates/certificateQueryBuilder';
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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
    
    const loadCertificates = async () => {
      setIsLoading(true);
      setError(null);
      
      const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
      
      try {
        const result = await fetchCertificates({
          profileId: profile.id,
          isAdmin,
          filters,
          sortColumn: sortConfig.column,
          sortDirection: sortConfig.direction
        });
        
        setCertificates(result.certificates);
        setBatches(result.batches);
        setError(result.error);
      } catch (error) {
        console.error("Error in useCertificateFiltering:", error);
        setError(error instanceof Error ? error : new Error('Unknown error loading certificates'));
        setCertificates([]);
        setBatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCertificates();
  }, [profile?.id, profile?.role, refetchTrigger, filters, sortConfig]);

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
    refetch: useCallback(() => setRefetchTrigger(prev => prev + 1), [])
  };
}
