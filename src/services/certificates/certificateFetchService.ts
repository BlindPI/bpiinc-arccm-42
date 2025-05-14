
// This file is now deprecated in favor of simpleCertificateService.ts
// Maintaining for backwards compatibility - will be removed in future updates

import { CertificateFilters, SortColumn, SortDirection } from '@/types/certificateFilters';
import { fetchCertificates } from './simpleCertificateService';

// Legacy interface for backwards compatibility
interface FetchCertificatesParams {
  profileId: string | undefined;
  isAdmin: boolean;
  filters: CertificateFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
}

// For backwards compatibility, using the new simplified service
export async function fetchCertificates(params: FetchCertificatesParams) {
  console.warn('certificateFetchService.fetchCertificates is deprecated. Use simpleCertificateService.fetchCertificates instead');
  
  const { profileId, isAdmin, filters, sortColumn, sortDirection } = params;
  
  const fromDate = filters.dateRange.from ? 
    filters.dateRange.from.toISOString().split('T')[0] : undefined;
    
  const toDate = filters.dateRange.to ? 
    filters.dateRange.to.toISOString().split('T')[0] : undefined;
  
  return await fetchCertificates({
    profileId,
    isAdmin,
    courseId: filters.courseId,
    status: filters.status,
    batchId: filters.batchId || undefined,
    fromDate,
    toDate,
    sortColumn,
    sortDirection
  });
}
