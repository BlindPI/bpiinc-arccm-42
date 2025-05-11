
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

// Add helper function to create default objects
export const createDefaultProcessingStatus = (): ProcessingStatus => ({
  total: 0,
  processed: 0,
  successful: 0,
  failed: 0,
  errors: []
});

export const createDefaultProcessedData = (): ProcessedData => ({
  data: [],
  totalCount: 0,
  errorCount: 0
});
