
export interface ProcessedData {
  data: any[];
  totalCount: number;
  errorCount: number;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors?: string[];
}
