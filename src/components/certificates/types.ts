
export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export type RowData = Record<string, any>;
