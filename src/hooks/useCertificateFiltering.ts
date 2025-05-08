
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

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

// Define a Certificate type that includes batch_id and batch_name
interface Certificate {
  id: string;
  certificate_request_id: string | null;
  issued_by: string | null;
  verification_code: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  certificate_url: string | null;
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
  created_at: string;
  updated_at: string;
  batch_id: string | null;
  batch_name: string | null;
  user_id: string | null;
  location_id: string | null;
  template_id: string | null;
  length: number | null;
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

  // Fetch certificates with filters and sorting
  const fetchCertificates = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (!profile?.id) {
        return;
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
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      console.log(`Found ${data?.length || 0} certificates`);
      setCertificates(data || []);
      
      // Extract unique batches for the filter
      if (data && data.length > 0) {
        const uniqueBatches = Array.from(
          new Map(
            data
              .filter(cert => cert.batch_id)
              .map(cert => [
                cert.batch_id, 
                { id: cert.batch_id, name: cert.batch_name || `Batch ${cert.batch_id.slice(0, 8)}` }
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
  }, [profile, filters, sortConfig]);

  // Fetch certificates when filters, sorting, or profile changes
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
