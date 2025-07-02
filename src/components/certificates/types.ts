export type CourseMatchType = 'exact' | 'partial' | 'fallback' | 'default' | 'mismatch' | 'manual';

export interface CourseMatch {
  id: string;
  name: string;
  matchType: CourseMatchType;
  length?: number;
  expiration_months: number;
  courseType?: string;
  certifications: Array<{
    type: string;
    level: string;
  }>;
  mismatchReason?: string; // Added for mismatch cases
}

// Add the ProcessingStatus type that was missing
export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}

// Add the RowData type that was referenced but missing
export interface RowData {
  'Student Name'?: string | number;
  'Email'?: string | number;
  'Phone'?: string | number;
  'Company'?: string | number;
  'Organization'?: string | number;
  'First Aid Level'?: string | number;
  'CPR Level'?: string | number;
  'Instructor Level'?: string | number;
  'Length'?: string | number;
  'Issue Date'?: string | number | Date;
  'Expiry Date'?: string | number | Date;
  'City'?: string | number;
  'Location'?: string | number;
  'Province'?: string | number;
  'State'?: string | number;
  'Postal Code'?: string | number;
  'Zip Code'?: string | number;
  'Pass/Fail'?: string | number;
  'Assessment'?: string | number;
  'Assessment Status'?: string | number;
  [key: string]: any; // Allow for other properties
}
