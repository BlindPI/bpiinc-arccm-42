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

  // Helper function to build and execute the query
  const executeCertificateQuery = useCallback(async (profile: any, filters: CertificateFilters, sortConfig: {column: SortColumn, direction: SortDirection}) => {
    if (!profile?.id) {
      return { data: [], error: new Error('No user profile') };
    }
    
    console.log(`Fetching certificates with filters:`, filters);
    console.log(`Sorting by ${sortConfig.column} ${sortConfig.direction}`);

    // Build the query based on user role and filters
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Filter by user_id for non-admins
    const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
    if (!isAdmin) {
      query = query.eq('user_id', profile.id);
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
    query = query.order(sortConfig.column, { ascending: sortConfig.direction === 'asc' });
    
    // Execute the query
    return await query;
  }, []);

  // Fetch certificates with filters and sorting
  const fetchCertificates = useCallback(async () => {
    if (!profile?.id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use primitive values from refs to avoid circular dependencies
      const currentFilters = filtersRef.current;
      const currentSortConfig = sortConfigRef.current;
      
      const { data, error } = await executeCertificateQuery(profile, currentFilters, currentSortConfig);
      
      if (error) {
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} certificates`);
      
      // Explicitly cast the data to Certificate[] to avoid type issues
      const typedCertificates = data as Certificate[];
      setCertificates(typedCertificates);
      
      // Extract unique batches for the filter
      if (typedCertificates && typedCertificates.length > 0) {
        const uniqueBatches = Array.from(
          new Map(
            typedCertificates
              .filter(cert => cert.batch_id)
              .map(cert => [
                cert.batch_id, 
                { id: cert.batch_id!, name: cert.batch_name || `Batch ${cert.batch_id!.slice(0, 8)}` }
              ])
          ).values()
        );
        setBatches(uniqueBatches);
      }
      
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setError(error instanceof Error ? error : new Error('Unknown error fetching certificates'));
      toast.error('Failed to load certificates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, executeCertificateQuery]); // Simplified dependency array

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
