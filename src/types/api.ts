
export interface ComplianceData {
  isCompliant: boolean;
  notes?: string;
  lastCheck?: string;
  submittedDocuments: number;
  requiredDocuments: number;
  nextReviewDate?: string;
}

export interface TeachingData {
  sessions: Array<{
    id: string;
    date: string;
    status: string;
  }>;
}

export interface DocumentRequirement {
  id: string;
  type: string;
  required: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
