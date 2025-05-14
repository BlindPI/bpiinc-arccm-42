
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
    
    // Build query
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Apply filters
    if (!isAdmin) {
      query = query.eq('user_id', profileId);
    }
    
    if (filters.courseId && filters.courseId !== 'all') {
      query = query.eq('course_name', filters.courseId);
    }
    
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    
    if (filters.dateRange.from) {
      // For date filtering, we need to handle string dates
      // This is a simplified approach - in a real app you'd want more robust date handling
      const fromDate = filters.dateRange.from.toISOString().split('T')[0];
      query = query.gte('issue_date', fromDate);
    }
    
    if (filters.dateRange.to) {
      const toDate = filters.dateRange.to.toISOString().split('T')[0];
      query = query.lte('issue_date', toDate);
    }
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    const { data, error: queryError } = await query;
    
    if (queryError) {
      console.error("Certificate query error:", queryError);
      throw queryError;
    }
    
    console.log(`Found ${data?.length || 0} certificates`);
    
    // Cast the data to Certificate[] to avoid type conflicts
    const typedCertificates = data as unknown as Certificate[];
    
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
