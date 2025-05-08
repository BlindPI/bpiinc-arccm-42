import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Certificate } from '@/types/certificates';

export type SortColumn = 'recipient_name' | 'course_name' | 'issue_date' | 'expiry_date' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface CertificateFilters {
  courseId: string;
  status: string;
  dateRange: DateRange;
  batchId: string | null;
}

interface UseCertificateFilteringProps {
  initialFilters?: CertificateFilters;
}

// Move this outside of the hook to avoid circular dependencies
// This is a pure function with no dependencies on the hook's state
function buildCertificateQuery(
  profileId: string | undefined, 
  isAdmin: boolean,
  filters: CertificateFilters, 
  sortColumn: SortColumn, 
  sortDirection: SortDirection
) {
  if (!profileId) {
    return null;
  }
  
  let query = supabase
    .from('certificates')
    .select('*');
  
  // Apply user filter if not admin
  if (!isAdmin) {
    query = query.eq('user_id', profileId);
  }
  
  // Apply course filter
  if (filters.courseId !== 'all') {
    query = query.eq('course_id', filters.courseId);
  }
  
  // Apply status filter
  if (filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  // Apply batch/roster filter
  if (filters.batchId) {
    query = query.eq('batch_id', filters.batchId);
  }
  
  // Apply date range filter for issue_date
  if (filters.dateRange.from) {
    const fromDate = filters.dateRange.from.toISOString().split('T')[0];
    query = query.gte('issue_date', fromDate);
  }
  
  if (filters.dateRange.to) {
    const toDate = filters.dateRange.to.toISOString().split('T')[0];
    query = query.lte('issue_date', toDate);
  }
  
  // Apply sorting
  query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
  
  return query;
}

export function useCertificateFiltering({ initialFilters }: UseCertificateFilteringProps = {}) {
  const { data: profile } = useProfile();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0); // Use this to trigger refetches
  
  const [filters, setFilters] = useState<CertificateFilters>(initialFilters || {
    courseId: 'all',
    status: 'all',
    dateRange: {},
    batchId: null
  });
  
  const [sortConfig, setSortConfig] = useState<{
    column: SortColumn;
    direction: SortDirection;
  }>({
    column: 'issue_date',
    direction: 'desc'
  });
  
  // For keeping track of unique batches/rosters
  const [batches, setBatches] = useState<{id: string, name: string}[]>([]);

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

  // Simplify this to depend only on profile changes and refetchTrigger
  useEffect(() => {
    async function fetchCertificates() {
      if (!profile?.id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
        
        console.log(`Fetching certificates with filters:`, filters);
        console.log(`Sorting by ${sortConfig.column} ${sortConfig.direction}`);
        
        const query = buildCertificateQuery(
          profile.id,
          isAdmin,
          filters,
          sortConfig.column,
          sortConfig.direction
        );
        
        if (!query) {
          throw new Error("Failed to build query");
        }
        
        const { data, error: queryError } = await query;
        
        if (queryError) {
          throw queryError;
        }
        
        console.log(`Found ${data?.length || 0} certificates`);
        
        // Explicitly cast the data to Certificate[]
        const typedCertificates = data as Certificate[];
        setCertificates(typedCertificates);
        
        // Extract unique batches for the filter
        if (typedCertificates && typedCertificates.length > 0) {
          const uniqueBatches = typedCertificates
            .filter(cert => cert.batch_id)
            .reduce((acc, cert) => {
              if (cert.batch_id && !acc.some(b => b.id === cert.batch_id)) {
                acc.push({
                  id: cert.batch_id,
                  name: cert.batch_name || `Batch ${cert.batch_id.slice(0, 8)}`
                });
              }
              return acc;
            }, [] as {id: string, name: string}[]);
          
          setBatches(uniqueBatches);
        }
        
      } catch (error) {
        console.error('Error fetching certificates:', error);
        setError(error instanceof Error ? error : new Error('Unknown error fetching certificates'));
        toast.error('Failed to load certificates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchCertificates();
  }, [profile?.id, profile?.role, refetchTrigger]); // Only depend on profile and refetch trigger

  // Add effect to trigger refetch when filters or sort change
  useEffect(() => {
    setRefetchTrigger(prev => prev + 1);
  }, [filters]);

  return {
    certificates,
    isLoading,
    error,
    filters,
    // Update setFilters to trigger refetch
    setFilters,
    sortConfig,
    handleSort,
    resetFilters,
    batches,
    refetch: useCallback(() => setRefetchTrigger(prev => prev + 1), [])
  };
}
