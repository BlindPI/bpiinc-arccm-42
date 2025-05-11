
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
  errors: string[];
}

export interface CourseMatch {
  courseId: string;
  courseName: string;
  matchType: 'exact' | 'partial' | 'manual';
  confidence: number;
  certifications?: {
    type: string;
    level: string;
  }[];
  expirationMonths?: number;
}

export interface BatchRowData {
  rowNum: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  courseLength?: number;
  issueDate: string;
  expiryDate?: string;
  assessmentStatus?: string;
  isProcessed: boolean;
  error?: string;
  courseMatches?: CourseMatch[];
  batchId?: string;
  batchName?: string;
}
