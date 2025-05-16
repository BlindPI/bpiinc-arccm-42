
import { supabase } from '@/integrations/supabase/client';
import { CertificateFilters, SortColumn, SortDirection } from '@/types/certificateFilters';

/**
 * Builds a query for fetching certificates based on provided filters and sorting criteria
 * 
 * @param profileId - User's profile ID
 * @param isAdmin - Whether the user is an admin
 * @param filters - Certificate filters to apply
 * @param sortColumn - Column to sort by
 * @param sortDirection - Direction to sort in
 * @returns Supabase query object or null if invalid parameters
 */
export function buildCertificateQuery(
  profileId: string,
  isAdmin: boolean,
  filters: CertificateFilters,
  sortColumn: SortColumn,
  sortDirection: SortDirection
) {
  if (!profileId) {
    console.error('No profile ID provided for certificate query');
    return null;
  }

  try {
    // Start building the query - use explicit type assertion to prevent deep type instantiation
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Only filter by user_id if not an admin
    if (!isAdmin) {
      query = query.eq('user_id', profileId);
    }
    
    // Apply individual filters one by one
    query = applyStatusFilter(query, filters.status);
    query = applyCourseFilter(query, filters.courseId);
    query = applyBatchFilter(query, filters.batchId);
    query = applyDateRangeFilter(query, filters.dateRange);
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    return query;
    
  } catch (error) {
    console.error('Error building certificate query:', error);
    return null;
  }
}

/**
 * Apply status filter to the query
 */
function applyStatusFilter(query: any, status: string | undefined) {
  if (status && status !== 'all') {
    return query.eq('status', status);
  }
  return query;
}

/**
 * Apply course filter to the query
 */
function applyCourseFilter(query: any, courseId: string | undefined) {
  if (courseId && courseId !== 'all') {
    // Use simple string equality instead of complex type inference
    return query.eq('course_id', courseId);
  }
  return query;
}

/**
 * Apply batch filter to the query
 */
function applyBatchFilter(query: any, batchId: string | null) {
  if (batchId) {
    return query.eq('batch_id', batchId);
  }
  return query;
}

/**
 * Apply date range filter to the query
 */
function applyDateRangeFilter(query: any, dateRange: { from?: Date; to?: Date }) {
  if (dateRange.from) {
    query = query.gte('issue_date', dateRange.from.toISOString());
  }
  
  if (dateRange.to) {
    query = query.lte('issue_date', dateRange.to.toISOString());
  }
  
  return query;
}
