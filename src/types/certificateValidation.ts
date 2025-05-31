
export interface CertificateValidationError {
  field: string;
  message: string;
  type: 'required' | 'invalid' | 'duplicate';
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: CertificateValidationError[];
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
  courseId?: string;
  locationId: string; // Made required
  locationName: string;
  instructorName?: string;
  instructorLevel?: string;
  firstAidLevel?: string;
  cprLevel?: string;
  assessmentStatus: 'PASS' | 'FAIL' | 'PENDING';
  issueDate: string;
  expiryDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  rejectionReason?: string;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  batchId?: string;
  batchName?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  validationErrors?: CertificateValidationError[];
}

export const validateCertificateRequest = (request: Partial<EnhancedCertificateRequest>): CertificateValidationError[] => {
  const errors: CertificateValidationError[] = [];

  if (!request.recipientName?.trim()) {
    errors.push({ field: 'recipientName', message: 'Recipient name is required', type: 'required' });
  }

  if (!request.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required', type: 'required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email)) {
    errors.push({ field: 'email', message: 'Invalid email format', type: 'invalid' });
  }

  if (!request.courseName?.trim()) {
    errors.push({ field: 'courseName', message: 'Course name is required', type: 'required' });
  }

  if (!request.locationId?.trim()) {
    errors.push({ field: 'locationId', message: 'Location selection is mandatory', type: 'required' });
  }

  if (!request.issueDate) {
    errors.push({ field: 'issueDate', message: 'Issue date is required', type: 'required' });
  }

  if (!request.expiryDate) {
    errors.push({ field: 'expiryDate', message: 'Expiry date is required', type: 'required' });
  }

  if (!request.assessmentStatus) {
    errors.push({ field: 'assessmentStatus', message: 'Assessment status is required', type: 'required' });
  }

  return errors;
};
