
import { DocumentSubmission } from '@/types/user-management';

export interface DocumentStatus {
  totalDocuments: number;
  approvedDocuments: number;
  completionPercentage: number;
}

export const calculateDocumentStatus = (submissions: DocumentSubmission[] | undefined): DocumentStatus => {
  const totalDocuments = submissions?.length || 0;
  const approvedDocuments = submissions?.filter(s => s.status === 'APPROVED').length || 0;
  const completionPercentage = totalDocuments > 0 ? (approvedDocuments / totalDocuments) * 100 : 0;

  return {
    totalDocuments,
    approvedDocuments,
    completionPercentage,
  };
};
