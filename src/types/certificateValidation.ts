
export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'duplicate' | 'format';
  row?: number;
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  validRecords: number;
  totalRecords: number;
}

export interface EnhancedCertificateRequest {
  id: string;
  recipientName: string;
  email: string;
  phone?: string;
  company?: string;
  courseName: string;
  courseId: string;
  locationId: string;
  locationName: string;
  assessmentStatus: 'PASS' | 'FAIL';
  issueDate: string;
  expiryDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedBy: string;
  submittedAt: string;
  instructorName?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  validationErrors?: ValidationError[];
  rejectionReason?: string;
}

export interface ProcessedRosterData {
  requests: EnhancedCertificateRequest[];
  validation: BatchValidationResult;
  metadata: {
    fileName: string;
    processedAt: string;
    totalRows: number;
    validRows: number;
  };
}
