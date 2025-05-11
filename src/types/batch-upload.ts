
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
  errors: string[]; // Changed from optional to required to match the type in certificates/types.ts
}
