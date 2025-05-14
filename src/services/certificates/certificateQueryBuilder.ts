
/**
 * Certificate query builder functionality
 */

import { supabase } from '@/integrations/supabase/client';
import { CertificateFilters, SortColumn, SortDirection, BatchInfo } from '@/types/certificateFilters';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { handleError } from '@/utils/error-handler';

interface FetchCertificatesParams {
  profileId: string | undefined;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  page?: number;
  pageSize?: number;
}

interface FetchCertificatesResult {
  certificates: Certificate[];
  batches: BatchInfo[];
  totalCount: number;
  error: Error | null;
}

/**
 * Handles fetching certificates from Supabase based on filters, sorting, and pagination
 */
export async function fetchCertificates({
  profileId,
  isAdmin,
  filters,
  sortColumn,
  sortDirection,
  page = 1,
  pageSize = 10
}: FetchCertificatesParams): Promise<FetchCertificatesResult> {
  if (!profileId) {
    return {
      certificates: [],
      batches: [],
      totalCount: 0,
      error: new Error('No profile ID provided')
    };
  }
  
  try {
    console.log(`Fetching certificates with filters:`, filters);
    console.log(`Sorting by ${sortColumn} ${sortDirection}, page: ${page}, pageSize: ${pageSize}`);
    
    // Build filter conditions object
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
    
    // Calculate pagination range
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Get count for pagination
    const countQuery = supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true });
      
    // Apply filters to count query
    if (Object.keys(filterConditions).length > 0) {
      countQuery.match(filterConditions);
    }
    
    // Handle date range filters for count query
    if (filters.dateRange.from) {
      const fromDate = filters.dateRange.from.toISOString().split('T')[0];
      countQuery.gte('issue_date', fromDate);
    }
    
    if (filters.dateRange.to) {
      const toDate = filters.dateRange.to.toISOString().split('T')[0];
      countQuery.lte('issue_date', toDate);
    }
    
    // Execute count query
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      throw countError;
    }
    
    // Main data query
    let dataQuery = supabase
      .from('certificates')
      .select('*')
      .range(from, to)
      .order(sortColumn, { ascending: sortDirection === 'asc' });
    
    // Apply filters to data query
    if (Object.keys(filterConditions).length > 0) {
      dataQuery.match(filterConditions);
    }
    
    // Handle date range filters for data query
    if (filters.dateRange.from) {
      const fromDate = filters.dateRange.from.toISOString().split('T')[0];
      dataQuery.gte('issue_date', fromDate);
    }
    
    if (filters.dateRange.to) {
      const toDate = filters.dateRange.to.toISOString().split('T')[0];
      dataQuery.lte('issue_date', toDate);
    }
    
    // Execute data query
    const { data, error: dataError } = await dataQuery;
    
    if (dataError) {
      throw dataError;
    }
    
    console.log(`Found ${data?.length || 0} certificates (out of ${count} total)`);
    
    // Cast the data to Certificate[]
    const certificates = data as Certificate[];
    
    // Extract unique batches for the filter
    const batches = certificates
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
    
    return {
      certificates,
      batches,
      totalCount: count || 0,
      error: null
    };
    
  } catch (error) {
    const message = handleError(error, {
      context: 'Certificate fetch',
      fallbackMessage: 'Failed to load certificates'
    });
    
    return {
      certificates: [],
      batches: [],
      totalCount: 0,
      error: new Error(message)
    };
  }
}
