
import { supabase } from '@/integrations/supabase/client';
import { BatchInfo, CertificateFilters, SortColumn, SortDirection } from '@/types/certificateFilters';
import { Certificate } from '@/types/certificates';

interface FetchCertificatesParams {
  profileId: string;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

interface FetchCertificatesResult {
  certificates: Certificate[];
  batches: BatchInfo[];
}

export async function fetchCertificates({
  profileId,
  isAdmin,
  filters,
  sortColumn,
  sortDirection
}: FetchCertificatesParams): Promise<FetchCertificatesResult> {
  try {
    console.log('Fetching certificates with filters:', { 
      profileId, isAdmin, filters, sortColumn, sortDirection 
    });
    
    // Start building the query
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Apply user filter for non-admins
    if (!isAdmin) {
      query = query.eq('user_id', profileId);
    }
    
    // Apply course filter if specified
    if (filters.courseId && filters.courseId !== 'all') {
      query = query.ilike('course_name', `%${filters.courseId}%`);
    }
    
    // Apply status filter if specified
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    // Apply date range filter if specified
    if (filters.dateRange) {
      if (filters.dateRange.from) {
        const formattedDate = new Date(filters.dateRange.from).toISOString().split('T')[0];
        query = query.gte('issue_date', formattedDate);
      }
      
      if (filters.dateRange.to) {
        const formattedDate = new Date(filters.dateRange.to).toISOString().split('T')[0];
        query = query.lte('issue_date', formattedDate);
      }
    }

    // Apply batch filter if specified
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    // Execute the query
    const { data: certificates, error } = await query;
    
    if (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
    
    // Fetch batch information - FIXED: removed problematic filters
    const { data: batchesRaw, error: batchError } = await supabase
      .from('certificates')
      .select('batch_id, batch_name')
      .order('batch_name');
    
    if (batchError) {
      console.error('Error fetching batch information:', batchError);
      throw batchError;
    }
    
    // Process batches to get unique entries with non-null batch_id values
    const uniqueBatches: BatchInfo[] = [];
    const batchMap = new Map<string, string>();
    
    // Filter out null values in JavaScript instead of using is/not filters
    batchesRaw?.forEach(item => {
      if (item.batch_id && item.batch_name && !batchMap.has(item.batch_id)) {
        batchMap.set(item.batch_id, item.batch_name);
        uniqueBatches.push({
          id: item.batch_id,
          name: item.batch_name
        });
      }
    });
    
    return {
      certificates: certificates as Certificate[],
      batches: uniqueBatches
    };
  } catch (error) {
    console.error('Error in fetchCertificates:', error);
    throw error;
  }
}
