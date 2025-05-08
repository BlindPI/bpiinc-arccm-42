
import { useState, useCallback, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { Certificate } from '@/types/certificates';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
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

// Implementation of certificate fetching function
async function fetchCertificates(
  profileId: string | undefined, 
  isAdmin: boolean, 
  filters: CertificateFilters,
  sortColumn: SortColumn,
  sortDirection: SortDirection
): Promise<{ certificates: Certificate[], batches: BatchInfo[], error: Error | null }> {
  if (!profileId) {
    return {
      certificates: [],
      batches: [],
      error: new Error('No profile ID provided')
    };
  }
  
  try {
    console.log(`Fetching certificates with filters:`, filters);
    console.log(`Sorting by ${sortColumn} ${sortDirection}`);
    
    // Start building the query
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Apply filters
    if (!isAdmin) {
      // Regular users can only see their own certificates
      query = query.eq('user_id', profileId);
    }
    
    // Filter by status if specified
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Filter by course if specified
    if (filters.courseId && filters.courseId !== 'all') {
      query = query.eq('course_id', filters.courseId);
    }
    
    // Filter by batch if specified
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    
    // Date range filters
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start.toISOString());
      }
      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end.toISOString());
      }
    }
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    // Execute the query
    const { data, error: queryError } = await query;
    
    if (queryError) {
      throw queryError;
    }
    
    console.log(`Found ${data?.length || 0} certificates`);
    
    // Explicitly cast the data to Certificate[]
    const typedCertificates = data as Certificate[];
    
    // Extract unique batches for the filter
    let batches: BatchInfo[] = [];
    if (typedCertificates && typedCertificates.length > 0) {
      batches = typedCertificates
        .filter(cert => cert.batch_id)
        .reduce((acc, cert) => {
          if (cert.batch_id && !acc.some(b => b.id === cert.batch_id)) {
            acc.push({
              id: cert.batch_id,
              name: cert.batch_name || `Batch ${cert.batch_id.slice(0, 8)}`
            });
          }
          return acc;
        }, [] as BatchInfo[]);
    }
    
    return {
      certificates: typedCertificates,
      batches,
      error: null
    };
    
  } catch (error) {
    console.error('Error fetching certificates:', error);
    const typedError = error instanceof Error ? error : new Error('Unknown error fetching certificates');
    toast.error('Failed to load certificates. Please try again.');
    
    return {
      certificates: [],
      batches: [],
      error: typedError
    };
  }
}

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
      
      const result = await fetchCertificates(
        profile.id,
        isAdmin,
        filters,
        sortConfig.column,
        sortConfig.direction
      );
      
      setCertificates(result.certificates);
      setBatches(result.batches);
      setError(result.error);
      setIsLoading(false);
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
