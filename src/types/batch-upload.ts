
export interface ProcessedData {
  data: any[];
  totalCount: number;
  errorCount: number;
  batchId?: string;
  batchName?: string;
}

export interface ProcessingStatus {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  errors: string[]; 
  batchId?: string;
  batchName?: string;
  startTime?: number;
  endTime?: number;
  inProgress?: boolean;
}

export interface BatchValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BatchSubmissionResult {
  success: boolean;
  batchId?: string;
  batchName?: string;
  certificatesCount?: number;
  processingTime?: number;
  errors?: string[];
  message?: string;
}

export interface BatchFilterOptions {
  batchId?: string;
  batchName?: string;
  fromDate?: string;
  toDate?: string;
  status?: 'active' | 'expired' | 'revoked' | 'all';
}

// Enhanced batch certificate data interface
export interface BatchCertificateData {
  recipientName: string;
  recipientEmail: string;
  courseId?: string;
  courseName?: string;
  issueDate: string;
  expiryDate?: string;
  completionDate?: string;
  location?: string;
  locationId?: string;
  verificationCode?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  batchId?: string;
  batchName?: string;
  rowNumber?: number;
}

export type BatchUploadStep = 'UPLOAD' | 'REVIEW' | 'SUBMITTING' | 'COMPLETE';
