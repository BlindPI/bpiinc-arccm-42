
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { SortColumn, SortDirection, CertificateFilters, BatchInfo } from '@/types/certificateFilters';
import { buildCertificateQuery } from './certificateQueryBuilder';

interface FetchCertificatesParams {
  profileId: string;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

/**
 * Fetches certificates based on provided parameters
 */
export const fetchCertificates = async ({
  profileId,
  isAdmin,
  filters,
  sortColumn,
  sortDirection,
}: FetchCertificatesParams) => {
  try {
    console.log('Fetching certificates with params:', {
      profileId,
      isAdmin,
      filters,
      sortColumn,
      sortDirection
    });

    // Use the certificate query builder
    const query = buildCertificateQuery(
      profileId, 
      isAdmin, 
      filters, 
      sortColumn, 
      sortDirection
    );
    
    if (!query) {
      throw new Error('Failed to build certificate query');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error in certificate query:', error);
      throw error;
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
};
