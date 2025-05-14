
import { supabase } from '@/integrations/supabase/client';
import { CertificateFilters, SortColumn, SortDirection } from '@/types/certificateFilters';

// Simplified query builder to avoid excessive type depth issues
export function buildCertificateQuery({
  profileId,
  isAdmin,
  filters,
  sortColumn,
  sortDirection
}: {
  profileId: string | undefined;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}) {
  // Start building query
  let query = supabase
    .from('certificates')
    .select('*');
  
  // Apply user filter only if not an admin
  if (!isAdmin && profileId) {
    query = query.eq('user_id', profileId);
  }
  
  // Apply other filters
  if (filters.courseId && filters.courseId !== 'all') {
    query = query.eq('course_name', filters.courseId);
  }
  
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.batchId) {
    query = query.eq('batch_id', filters.batchId);
  }
  
  // Handle date range filtering
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
