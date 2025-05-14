
// This file is now deprecated in favor of simpleCertificateService.ts
// Maintaining for backwards compatibility - will be removed in future updates

import { supabase } from '@/integrations/supabase/client';
import { CertificateFilters, SortColumn, SortDirection } from '@/types/certificateFilters';
import { fetchCertificates } from './simpleCertificateService';

// For backwards compatibility, using the new simplified service
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
  console.warn('buildCertificateQuery is deprecated. Use simpleCertificateService.fetchCertificates instead');
  
  // This function now acts as a wrapper around the new simplified service
  const fromDate = filters.dateRange.from ? 
    filters.dateRange.from.toISOString().split('T')[0] : undefined;
    
  const toDate = filters.dateRange.to ? 
    filters.dateRange.to.toISOString().split('T')[0] : undefined;
  
  fetchCertificates({
    profileId,
    isAdmin,
    courseId: filters.courseId,
    status: filters.status,
    batchId: filters.batchId || undefined,
    fromDate,
    toDate,
    sortColumn,
    sortDirection
  }).then(result => {
    return result.certificates;
  });
  
  // Return something compatible with the old API for backwards compatibility
  return supabase
    .from('certificates')
    .select('*');
}
