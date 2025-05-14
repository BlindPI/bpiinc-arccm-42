
import { supabase } from '@/integrations/supabase/client';
import { SortColumn, SortDirection, CertificateFilters } from '@/types/certificateFilters';

/**
 * Builds a Supabase query for certificates based on provided filters and sorting criteria
 * 
 * @param profileId - The ID of the current user
 * @param isAdmin - Whether the current user is an admin
 * @param filters - The certificate filters to apply
 * @param sortColumn - The column to sort by
 * @param sortDirection - The direction to sort (asc/desc)
 * @returns A configured Supabase query builder or null if no profile is provided
 */
export function buildCertificateQuery(
  profileId: string | undefined, 
  isAdmin: boolean,
  filters: CertificateFilters, 
  sortColumn: SortColumn, 
  sortDirection: SortDirection
) {
  if (!profileId) {
    return null;
  }
  
  // Create a new query object each time
  let query = supabase.from('certificates').select('*');
  
  // Apply user filter if not admin
  if (!isAdmin) {
    query = query.eq('user_id', profileId);
  }
  
  // Apply filters one at a time to avoid deep chaining
  // Apply course filter
  if (filters.courseId && filters.courseId !== 'all') {
    query = query.eq('course_id', filters.courseId);
  }
  
  // Apply status filter
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  // Apply batch/roster filter
  if (filters.batchId) {
    query = query.eq('batch_id', filters.batchId);
  }
  
  // Apply date range filter for issue_date
  if (filters.dateRange?.from) {
    const fromDate = filters.dateRange.from.toISOString().split('T')[0];
    query = query.gte('issue_date', fromDate);
  }
  
  if (filters.dateRange?.to) {
    const toDate = filters.dateRange.to.toISOString().split('T')[0];
    query = query.lte('issue_date', toDate);
  }
  
  // Apply sorting with explicit typing
  const ascending = sortDirection === 'asc';
  return query.order(sortColumn, { ascending });
}
