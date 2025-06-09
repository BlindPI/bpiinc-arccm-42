
// Certificate-related types

export interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED';
  rejectionReason?: string;
  profile: {
    id: string;
    role: string;
  };
}

export interface ProcessingStatus {
  message: string;
  progress: number;
  isComplete: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface RowData {
  [key: string]: any;
}

export interface CertificateBatchItem {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  email?: string;
  batch_id?: string;
  batch_name?: string;
}

// Add missing LocationEmailTemplate interface
export interface LocationEmailTemplate {
  id: string;
  location_id: string;
  template_name: string;
  template_type: 'certificate' | 'notification' | 'reminder';
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Main Certificate interface
export interface Certificate {
  id: string;
  recipient_name: string;
  recipient_email?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  verification_code: string;
  certificate_url?: string;
  thumbnail_url?: string;
  location_id?: string;
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  instructor_name?: string;
  instructor_level?: string;
  first_aid_level?: string;
  cpr_level?: string;
  length?: number;
  assessment_status?: string;
  user_id?: string;
  issued_by?: string;
  created_at: string;
  updated_at: string;
  generation_status?: string;
  email_status?: string;
  is_batch_emailed?: boolean;
  batch_email_id?: string;
  last_emailed_at?: string;
  thumbnail_status?: string;
  generation_attempts?: number;
  generation_error?: string;
  last_generation_attempt?: string;
  certificate_request_id?: string;
  template_id?: string;
}

// Email batch operation interface
export interface EmailBatchOperation {
  id: string;
  batch_name?: string;
  total_certificates: number;
  processed_certificates: number;
  successful_emails: number;
  failed_emails: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  error_message?: string;
  created_at: string;
  completed_at?: string;
  created_by?: string;
}

// Certificate request with all fields
export interface CertificateRequest {
  id: string;
  recipient_name: string;
  recipient_email?: string;
  email?: string;
  phone?: string;
  company?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  city?: string;
  province?: string;
  postal_code?: string;
  instructor_name?: string;
  instructor_level?: string;
  first_aid_level?: string;
  cpr_level?: string;
  length?: number;
  assessment_status?: string;
  status: string;
  user_id?: string;
  reviewer_id?: string;
  rejection_reason?: string;
  location_id?: string;
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  generation_attempts?: number;
  generation_error?: string;
  last_generation_attempt?: string;
  created_at: string;
  updated_at: string;
}

export interface EnhancedCertificateRequest extends CertificateRequest {
  submitter?: {
    id: string;
    display_name?: string;
    email: string;
  };
  location?: {
    id: string;
    name: string;
    city?: string;
    state?: string;
  };
}

export interface CertificateRequestWithSubmitter extends CertificateRequest {
  submitter?: {
    id: string;
    display_name?: string;
    email: string;
  };
}
