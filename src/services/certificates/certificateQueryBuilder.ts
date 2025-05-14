
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
    // Start building the query
    let query = supabase
      .from('certificates')
      .select('*');
    
    // Only filter by user_id if not an admin
    if (!isAdmin) {
      query = query.eq('user_id', profileId);
    }
    
    // Apply filters
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      query = query.or(`recipient_name.ilike.%${searchTerm}%,course_name.ilike.%${searchTerm}%`);
    }
    
    if (filters.batchId) {
      query = query.eq('batch_id', filters.batchId);
    }
    
    if (filters.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    
    if (filters.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }
    
    // Apply sorting
    query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
    
    return query;
    
  } catch (error) {
    console.error('Error building certificate query:', error);
    return null;
  }
}
