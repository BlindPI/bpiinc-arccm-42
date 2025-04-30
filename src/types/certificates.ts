
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
  status: 'APPROVED' | 'REJECTED' | 'ARCHIVE_FAILED' | 'ARCHIVED';
  rejectionReason?: string;
  profile?: any;
  fontCache?: any;
}
