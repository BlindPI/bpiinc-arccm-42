
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { CertificateFilters, SortColumn, SortDirection, BatchInfo } from '@/types/certificateFilters';

interface FetchCertificatesParams {
  profileId: string | undefined;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

interface FetchCertificatesResult {
  certificates: Certificate[];
  batches: BatchInfo[];
  error: Error | null;
}

/**
 * Handles fetching certificates from Supabase based on filters and sorting
 */
export async function fetchCertificates({
  profileId,
  isAdmin,
  filters,
  sortColumn,
  sortDirection
}: FetchCertificatesParams): Promise<FetchCertificatesResult> {
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
    
    // Create a filter object to avoid chained method calls
    const filterConditions: Record<string, any> = {};
    
    // Add user filter if not admin
    if (!isAdmin) {
      filterConditions.user_id = profileId;
    }
    
    // Apply course filter
    if (filters.courseId !== 'all') {
      filterConditions.course_id = filters.courseId;
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      filterConditions.status = filters.status;
    }
    
    // Apply batch/roster filter
    if (filters.batchId) {
      filterConditions.batch_id = filters.batchId;
    }
    
    // Perform basic query with filter object to avoid deep chaining
    let baseQuery = supabase.from('certificates').select('*');
    
    // Apply filter conditions using match() instead of multiple eq() calls
    if (Object.keys(filterConditions).length > 0) {
      baseQuery = baseQuery.match(filterConditions);
    }
    
    // Handle date range filters separately (can't use match() for these)
    if (filters.dateRange.from) {
      const fromDate = filters.dateRange.from.toISOString().split('T')[0];
      baseQuery = baseQuery.gte('issue_date', fromDate);
    }
    
    if (filters.dateRange.to) {
      const toDate = filters.dateRange.to.toISOString().split('T')[0];
      baseQuery = baseQuery.lte('issue_date', toDate);
    }
    
    // Explicitly cast to avoid deep type instantiation
    const sortedQuery = baseQuery as any;
    
    // Execute query with sorting
    const { data, error: queryError } = await sortedQuery.order(sortColumn, { 
      ascending: sortDirection === 'asc' 
    });
    
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
