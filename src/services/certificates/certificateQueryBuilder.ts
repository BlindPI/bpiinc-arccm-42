
import { supabase } from '@/integrations/supabase/client';
import { SortColumn, SortDirection, CertificateFilters } from '@/types/certificateFilters';

// Pure function outside the component to avoid deep recursive type issues
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
  let query = supabase
    .from('certificates')
    .select('*');
  
  // Apply user filter if not admin
  if (!isAdmin) {
    query = query.eq('user_id', profileId);
  }
  
  // Apply course filter
  if (filters.courseId !== 'all') {
    query = query.eq('course_id', filters.courseId);
  }
  
  // Apply status filter
  if (filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  // Apply batch/roster filter
  if (filters.batchId) {
    query = query.eq('batch_id', filters.batchId);
  }
  
  // Apply date range filter for issue_date
  if (filters.dateRange.from) {
    const fromDate = filters.dateRange.from.toISOString().split('T')[0];
    query = query.gte('issue_date', fromDate);
  }
  
  if (filters.dateRange.to) {
    const toDate = filters.dateRange.to.toISOString().split('T')[0];
    query = query.lte('issue_date', toDate);
  }
  
  // Apply sorting
  query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
  
  return query;
}
