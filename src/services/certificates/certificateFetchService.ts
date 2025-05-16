
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { buildCertificateQuery } from './certificateQueryBuilder';
import { BatchInfo } from '@/types/certificateFilters';

interface FetchCertificatesProps {
  profileId: string;
  isAdmin?: boolean;
  filters?: {
    courseId?: string;
    status?: string;
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    batchId?: string | null;
  };
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

interface FetchCertificatesResult {
  certificates: Certificate[];
  batches: BatchInfo[];
  error: Error | null;
}

export async function fetchCertificates({
  profileId,
  isAdmin = false,
  filters = {},
  sortColumn = 'issue_date',
  sortDirection = 'desc'
}: FetchCertificatesProps): Promise<FetchCertificatesResult> {
  try {
    console.log('Fetching certificates with params:', { 
      isAdmin, 
      profileId, 
      filters, 
      sortColumn, 
      sortDirection 
    });

    // Start with the base query
    let query = supabase.from('certificates').select('*');
    
    // Use our query builder to apply filters
    let builder = buildCertificateQuery(query);
    
    // Filter by user if not an admin
    if (!isAdmin) {
      builder = builder.forUser(profileId);
    }
    
    // Apply status filter if provided
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'ACTIVE') {
        builder = builder.whereActive();
      } else if (filters.status === 'EXPIRED') {
        builder = builder.whereExpired();
      } else if (filters.status === 'REVOKED') {
        builder = builder.whereRevoked();
      }
    }
    
    // Apply course filter if provided
    if (filters.courseId && filters.courseId !== 'all') {
      builder = builder.forCourse(filters.courseId);
    }
    
    // Apply batch filter if provided
    if (filters.batchId) {
      builder = builder.inBatch(filters.batchId);
    }
    
    // Add date range filters if provided
    if (filters.dateRange?.start) {
      const startDate = filters.dateRange.start.toISOString();
      query = query.gte('created_at', startDate);
    }
    
    if (filters.dateRange?.end) {
      const endDate = filters.dateRange.end.toISOString();
      query = query.lte('created_at', endDate);
    }
    
    // Apply sorting
    builder = builder.orderBy(sortColumn, sortDirection === 'asc');

    // Execute the query
    const { data: certificates, error } = await builder.getQuery();

    // Prepare batches from the certificates
    const batchMap = new Map<string, BatchInfo>();
    certificates?.forEach(cert => {
      if (cert.batch_id && cert.batch_name) {
        if (!batchMap.has(cert.batch_id)) {
          batchMap.set(cert.batch_id, {
            id: cert.batch_id,
            name: cert.batch_name,
            count: 1
          });
        } else {
          const batch = batchMap.get(cert.batch_id)!;
          batch.count++;
        }
      }
    });

    // Convert batches map to array
    const batches = Array.from(batchMap.values());
    
    if (error) {
      throw error;
    }

    console.log(`Found ${certificates?.length || 0} certificates for user ${profileId}`);
    
    return { 
      certificates: certificates || [],
      batches,
      error: null 
    };
  } catch (error) {
    console.error('Error in fetchCertificates:', error);
    return { 
      certificates: [],
      batches: [],
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
