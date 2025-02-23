
export interface ComplianceData {
  isCompliant: boolean;
  notes?: string;
  lastCheck?: string;
  submittedDocuments: number;
  requiredDocuments: number;
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
