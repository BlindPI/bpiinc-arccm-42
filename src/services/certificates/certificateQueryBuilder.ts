
import { supabase } from '@/integrations/supabase/client';
import { SortColumn, SortDirection, CertificateFilters } from '@/types/certificateFilters';
import { SupabaseClient } from '@supabase/supabase-js';

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
  
  // Create a query from certificates table
  // Use any type to avoid deep recursive type inference
  let query: any = supabase
    .from('certificates')
    .select('*');
  
  // Apply user filter if not admin
  if (!isAdmin) {
    query = query.eq('user_id', profileId);
  }
  
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
  if (filters.dateRange && filters.dateRange.from) {
    const fromDate = filters.dateRange.from.toISOString().split('T')[0];
    query = query.gte('issue_date', fromDate);
  }
  
  if (filters.dateRange && filters.dateRange.to) {
    const toDate = filters.dateRange.to.toISOString().split('T')[0];
    query = query.lte('issue_date', toDate);
  }
  
  // Apply sorting - explicitly cast sortColumn to string to avoid type recursion
  const columnName = sortColumn as string;
  // Return the query with ordering applied
  return query.order(columnName, { ascending: sortDirection === 'asc' });
}
