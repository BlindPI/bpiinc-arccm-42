
export type CourseMatchType = 
  | 'exact' 
  | 'exact_code'        // New: Match based on course code
  | 'partial' 
  | 'fallback' 
  | 'default' 
  | 'manual'
  | 'instructor'        // New: Specific instructor match
  | 'instructor_fallback'  // New: Fallback instructor match
  | 'certification_value'; // New: Match based on certification values

export interface CourseMatch {
  id: string;
  name: string;
  code?: string;        // New: Course code field
  matchType: CourseMatchType;
  length?: number;
  expiration_months: number;
  courseType?: string;
  certifications?: {
    type: string;
    level: string;
  }[];
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
  'Course Code'?: string | number; // New: Course code field
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
