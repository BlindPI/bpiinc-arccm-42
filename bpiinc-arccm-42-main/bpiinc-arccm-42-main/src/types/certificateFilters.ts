import { Certificate } from './certificates';

export type SortColumn = 'recipient_name' | 'course_name' | 'issue_date' | 'expiry_date' | 'status' | 'created_at';
export type SortDirection = 'asc' | 'desc';

export interface DateRange {
  from?: Date;
  to?: Date;
  start?: Date;
  end?: Date;
}

export interface CertificateFilters {
  courseId: string;
  status: string;
  dateRange: DateRange;
  batchId: string | null;
}

export interface BatchInfo {
  id: string;
  name: string;
  count: number;
}

export interface SortConfig {
  column: SortColumn;
  direction: SortDirection;
}

export interface UseCertificateFilteringProps {
  initialFilters?: CertificateFilters;
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
