export interface CertificateEmailParams {
  certificateId: string;
  recipientEmail: string;
  message?: string;
  templateId?: string;
}

// Add NotificationParams for certificateNotifications.ts
export interface NotificationParams {
  recipientEmail: string;
  recipientName: string;
  recipientId?: string;
  message?: string;
  type?: string;
  title?: string;
  actionUrl?: string;
  sendEmail?: boolean;
  courseName?: string;
  rejectionReason?: string;
  category?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

// Add UpdateRequestParams for useCertificateRequest.ts
export interface UpdateRequestParams {
  id: string;
  status: string;
  rejectionReason?: string;
  profile: any;
}

// Add EmailTemplate interface for location email templates
export interface LocationEmailTemplate {
  id: string;
  location_id: string;
  name: string;
  subject_template: string;
  body_template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Add EmailBatchOperation interface to track batch email operations
export interface EmailBatchOperation {
  id: string;
  user_id: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_certificates: number;
  processed_certificates: number;
  successful_emails: number;
  failed_emails: number;
  created_at: string;
  completed_at: string | null;
  batch_name: string | null;
  error_message: string | null;
  is_visible: boolean;
}

export interface CertificateRequestData {
  recipientName: string;
  courseName: string;
  issueDate: string;
  expiryDate: string;
  locationId?: string;
  batchId?: string;
  batchName?: string;
  rosterId?: string;
}

export interface CertificateRequest {
  id: string;
  user_id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  location_id?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  recipient_name: string;
  recipient_email?: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code: string;
  certificate_url?: string;
  issued_by?: string;
  certificate_request_id?: string;
  location_id?: string;
  user_id?: string;
  batch_id?: string;
  batch_name?: string;
  roster_id?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  email_status: 'PENDING' | 'SENT' | 'FAILED';
  last_emailed_at?: string;
  created_at: string;
  updated_at: string;
}