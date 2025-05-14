
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { toast } from 'sonner';
import { BatchInfo } from '@/types/certificateFilters';

interface CertificateQueryParams {
  profileId?: string;
  isAdmin: boolean;
  courseId?: string;
  status?: string;
  batchId?: string;
  fromDate?: string;
  toDate?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Fetches certificates based on simpler, focused query parameters
 */
export async function fetchCertificates(params: CertificateQueryParams) {
  const { profileId, isAdmin, courseId, status, batchId, fromDate, toDate, sortColumn = 'issue_date', sortDirection = 'desc' } = params;
  
  try {
    console.log('Fetching certificates with params:', params);
    
    // Start building the query
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Filter by user if not an admin
    if (!isAdmin && profileId) {
      query = query.eq('user_id', profileId);
    }
    
    // Apply additional filters
    if (courseId && courseId !== 'all') {
      query = query.eq('course_name', courseId);
    }
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    // Only apply batch filtering if a valid batchId is provided
    if (batchId && batchId !== 'undefined' && batchId !== 'null') {
      query = query.eq('batch_id', batchId);
    }
    
    // Apply date range filters if provided
    if (fromDate && fromDate !== 'undefined') {
      query = query.gte('issue_date', fromDate);
    }
    
    if (toDate && toDate !== 'undefined') {
      query = query.lte('issue_date', toDate);
    }
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    // Execute the query
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
    
    console.log(`Successfully retrieved ${data?.length || 0} certificates`);
    
    // Extract unique batches for filtering
    const batches: BatchInfo[] = [];
    if (data && data.length > 0) {
      data.forEach(cert => {
        if (cert.batch_id && !batches.some(b => b.id === cert.batch_id)) {
          batches.push({
            id: cert.batch_id,
            name: cert.batch_name || `Batch ${cert.batch_id.slice(0, 8)}`
          });
        }
      });
    }
    
    return {
      certificates: data as Certificate[],
      batches,
      error: null
    };
    
  } catch (error) {
    console.error('Error in fetchCertificates:', error);
    toast.error('Failed to load certificates. Please try again.');
    
    return {
      certificates: [],
      batches: [],
      error: error instanceof Error ? error : new Error('Unknown error fetching certificates')
    };
  }
}

/**
 * Fetches available courses for certificates
 */
export async function fetchCertificateCourses() {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('course_name');
    
    if (error) {
      console.error('Error fetching certificate courses:', error);
      throw error;
    }
    
    // Extract unique course names
    const uniqueCourses = [...new Set(data.map(item => item.course_name))];
    return uniqueCourses;
  } catch (error) {
    console.error('Error in fetchCertificateCourses:', error);
    return [];
  }
}

/**
 * Fetches certificate statistics by status
 */
export async function fetchCertificateStats(profileId?: string, isAdmin: boolean = false) {
  try {
    let query = supabase.from('certificates').select('status');
    
    // Filter by user if not an admin
    if (!isAdmin && profileId) {
      query = query.eq('user_id', profileId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching certificate stats:', error);
      throw error;
    }
    
    // Process the data to count certificates by status
    const stats = {
      total: data.length,
      active: data.filter(cert => cert.status === 'ACTIVE').length,
      expired: data.filter(cert => cert.status === 'EXPIRED').length,
      revoked: data.filter(cert => cert.status === 'REVOKED').length
    };
    
    return stats;
  } catch (error) {
    console.error('Error in fetchCertificateStats:', error);
    return {
      total: 0,
      active: 0,
      expired: 0,
      revoked: 0
    };
  }
}
