
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
    
    // Build query directly here instead of using the separate builder function
    let query = supabase.from('certificates').select('*');
    
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
    
    // Apply sorting - use type assertion to avoid deep type instantiation
    const { data, error: queryError } = await query.order(sortColumn, { 
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
