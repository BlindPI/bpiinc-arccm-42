
export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

export type RowData = Record<string, any>;

// Expand the CourseMatchType to include 'fallback'
export type CourseMatchType = 'exact' | 'partial' | 'default' | 'manual' | 'fallback';

export interface CourseMatch {
  id: string;
  name: string;
  matchType: CourseMatchType;
  length?: number;           // Add optional length property
  expiration_months?: number; // Add optional expiration_months property
}
