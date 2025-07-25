
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

// Updated Certificate interface that includes all the properties used in the components
export interface Certificate {
  id: string;
  certificate_request_id: string | null;
  issued_by: string | null;
  verification_code: string;
  status: string; // Changed from union type to string to match database
  certificate_url: string | null;
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
  recipient_email: string | null;
  created_at: string;
  updated_at: string;
  batch_id: string | null;
  batch_name: string | null;
  user_id: string | null;
  location_id: string | null;
  template_id: string | null;
  length: number | null;
  email_status: string | null;
  last_emailed_at: string | null;
  is_batch_emailed: boolean;
  batch_email_id: string | null;
  roster_id: string | null;
  // Additional fields that may be present in database
  generation_status?: string | null;
  instructor_level?: string | null;
  instructor_name?: string | null;
  thumbnail_status?: string | null;
  thumbnail_url?: string | null;
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
