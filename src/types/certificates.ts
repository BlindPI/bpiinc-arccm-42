
export interface NotificationParams {
  recipientId: string;
  title?: string;
  message: string;
  type?: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO' | 'ACTION';
  actionUrl?: string;
  sendEmail?: boolean;
}

export interface CertificateStatus {
  id: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  expiry_date: string;
  issue_date: string;
  course_name: string;
  recipient_name: string;
}

export interface CertificateVerification {
  isValid: boolean;
  certificate?: CertificateStatus;
  message?: string;
}
