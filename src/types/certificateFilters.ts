
import { Certificate } from '@/types/certificates';

export type SortColumn = 'recipient_name' | 'course_name' | 'issue_date' | 'expiry_date' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface CertificateFilters {
  courseId: string;
  status: string;
  dateRange: DateRange;
  batchId: string | null;
}

export interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

export interface BatchInfo {
  id: string;
  name: string;
}

export interface UseCertificateFilteringResult {
  certificates: Certificate[];
  isLoading: boolean;
  error: Error | null;
  filters: CertificateFilters;
  setFilters: (filters: CertificateFilters) => void;
  sortConfig: SortConfig;
  handleSort: (column: SortColumn) => void;
  resetFilters: () => void;
  batches: BatchInfo[];
  refetch: () => void;
}

export interface UseCertificateFilteringProps {
  initialFilters?: CertificateFilters;
}
