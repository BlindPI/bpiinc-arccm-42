
import { User } from "./auth";

export interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  profile: User;
  fontCache: Record<string, ArrayBuffer>;
}

export interface NotificationParams {
  type: 'CERTIFICATE_REQUEST' | 'CERTIFICATE_APPROVED' | 'CERTIFICATE_REJECTED';
  recipientEmail: string;
  recipientName: string;
  courseName: string;
  rejectionReason?: string;
}
