
import { useState, useCallback, useEffect, useRef } from 'react';
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

export function useCertificateFiltering({ initialFilters }: UseCertificateFilteringProps = {}) {
  const { data: profile } = useProfile();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
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
  
  // Store filter values in refs to break dependency cycles
  const filtersRef = useRef(filters);
  const sortConfigRef = useRef(sortConfig);
  
  // Update refs when the state changes
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    sortConfigRef.current = sortConfig;
  }, [sortConfig]);
  
  // For keeping track of unique batches/rosters
  const [batches, setBatches] = useState<{id: string, name: string}[]>([]);

  // Handle sorting
  const handleSort = useCallback((column: SortColumn) => {
    setSortConfig(prevConfig => ({
      column,
      direction: prevConfig.column === column && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);
  
  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFilters({
      courseId: 'all',
      status: 'all',
      dateRange: {},
      batchId: null
    });
  }, []);

  // Extract query building to separate function that doesn't depend on state
  // to break circular dependencies
  const buildCertificateQuery = useCallback((
    profileId: string | undefined, 
    isAdmin: boolean,
    filters: CertificateFilters, 
    sortColumn: SortColumn, 
    sortDirection: SortDirection
  ) => {
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
  }, []);

  // Fetch certificates with filters and sorting
  const fetchCertificates = useCallback(async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current values from refs to break dependency cycles
      const currentFilters = filtersRef.current;
      const currentSortConfig = sortConfigRef.current;
      
      const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
      
      console.log(`Fetching certificates with filters:`, currentFilters);
      console.log(`Sorting by ${currentSortConfig.column} ${currentSortConfig.direction}`);
      
      const query = buildCertificateQuery(
        profile.id,
        isAdmin,
        currentFilters,
        currentSortConfig.column,
        currentSortConfig.direction
      );
      
      if (!query) {
        throw new Error("Failed to build query");
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
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
  }, [profile?.id, profile?.role, buildCertificateQuery]); 

  // Fetch certificates when profile changes or manually triggered
  useEffect(() => {
    if (profile?.id) {
      fetchCertificates();
    }
  }, [profile?.id, filters, sortConfig, fetchCertificates]);

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
    refetch: fetchCertificates
  };
}
