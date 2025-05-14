
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { buildCertificateQuery } from './certificateQueryBuilder';
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
    
    const query = buildCertificateQuery(
      profileId,
      isAdmin,
      filters,
      sortColumn,
      sortDirection
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
    
    // Fetch batch information
    let batches: BatchInfo[] = [];
    try {
      // Fetch all batch data and filter out nulls client-side
      const { data: batchesRaw, error: batchError } = await supabase
        .from('certificates')
        .select('batch_id, batch_name')
        .order('batch_name');
      
      if (batchError) {
        console.error('Error fetching batch information:', batchError);
        throw batchError;
      }
      
      // Filter out entries with null batch_id or batch_name
      const filteredBatches = batchesRaw?.filter(item => 
        item.batch_id !== null && item.batch_name !== null
      ) || [];
      
      // Extract unique batches
      batches = filteredBatches.reduce((acc, cert) => {
        if (cert.batch_id && !acc.some(b => b.id === cert.batch_id)) {
          acc.push({
            id: cert.batch_id,
            name: cert.batch_name || `Batch ${cert.batch_id.slice(0, 8)}`
          });
        }
        return acc;
      }, [] as BatchInfo[]);
      
    } catch (error) {
      console.error('Error fetching batch information:', error);
      // Continue with certificates, just with empty batches
    }
    
    return {
      certificates: typedCertificates,
      batches,
      error: null
    };
    
  } catch (error) {
    console.error('Error in fetchCertificates:', error);
    const typedError = error instanceof Error ? error : new Error('Unknown error fetching certificates');
    toast.error('Failed to load certificates. Please try again.');
    
    return {
      certificates: [],
      batches: [],
      error: typedError
    };
  }
}
