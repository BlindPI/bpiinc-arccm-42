
// Certificate-related types

export interface UpdateRequestParams {
  id: string;
  status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED';
  rejectionReason?: string;
  profile: {
    id: string;
    role: string;
  };
}

export interface ProcessingStatus {
  message: string;
  progress: number;
  isComplete: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

export interface RowData {
  [key: string]: any;
}

export interface CertificateBatchItem {
  id: string;
  recipient_name: string;
  course_name: string;
  issue_date: string;
  expiry_date: string;
  status: string;
  email?: string;
  batch_id?: string;
  batch_name?: string;
}
