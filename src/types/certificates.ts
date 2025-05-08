
export interface CertificateEmailParams {
  certificateId: string;
  recipientEmail: string;
  message?: string;
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
