
import { Profile } from "./user-management";

export interface CertificateRequest {
  id: string;
  user_id: string | null;
  recipient_name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  first_aid_level?: string | null;
  cpr_level?: string | null;
  assessment_status?: string | null;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewer_id?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateRequestInsert extends Omit<CertificateRequest, 'id' | 'created_at' | 'updated_at'> {}

export interface Certificate {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  verification_code: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  certificate_url?: string | null;
  certificate_request_id?: string | null;
  issued_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificateInsert extends Omit<Certificate, 'id' | 'created_at' | 'updated_at'> {}

export interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  profile: Profile;
  fontCache: Record<string, ArrayBuffer>;
}

export interface NotificationParams {
  type: 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED';
  recipientEmail: string;
  recipientName: string;
  courseName: string;
  rejectionReason?: string;
}
