
import { Profile } from "./user-management";

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
