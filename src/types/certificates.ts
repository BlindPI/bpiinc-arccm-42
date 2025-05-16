
export interface NotificationParams {
  recipientId?: string;
  recipientEmail?: string;
  recipientName?: string;
  title?: string;
  message: string;
  type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED' | 'CERTIFICATE_REQUEST';
  actionUrl?: string;
  sendEmail?: boolean;
  courseName?: string;
  rejectionReason?: string;
}

export interface CertificateStatus {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate: any; // Making this required
  status: string;
}

export interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  profile?: any;
  fontCache?: any;
}

// Add RosterUpload type
export interface RosterUpload {
  id: string;
  name: string;
  uploaded_by: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_records: number;
  processed_records: number;
  successful_records: number;
  failed_records: number;
}

// Update CertificateRequest type to include roster_id
export interface CertificateRequest {
  id: string;
  user_id: string;
  recipient_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  first_aid_level: string | null;
  cpr_level: string | null;
  assessment_status: string | null;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejection_reason: string | null;
  reviewer_id: string | null;
  created_at: string;
  updated_at: string;
  roster_id: string | null;  // Add this field
}
