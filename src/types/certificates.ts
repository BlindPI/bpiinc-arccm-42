
export interface CertificateEmailParams {
  certificateId: string;
  recipientEmail: string;
  message?: string;
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
}

// Add UpdateRequestParams for useCertificateRequest.ts
export interface UpdateRequestParams {
  id: string;
  status: string;
  rejectionReason?: string;
  profile: any;
}

// Add Certificate interface that includes batch_id and batch_name
export interface Certificate {
  id: string;
  certificate_request_id: string | null;
  issued_by: string | null;
  verification_code: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  certificate_url: string | null;
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
  created_at: string;
  updated_at: string;
  batch_id: string | null;
  batch_name: string | null;
  user_id: string | null;
  location_id: string | null;
  template_id: string | null;
  length: number | null;
}
