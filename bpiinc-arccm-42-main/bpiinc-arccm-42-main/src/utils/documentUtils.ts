
import { DocumentSubmission } from "@/types/user-management";

export const calculateDocumentStatus = (submissions: DocumentSubmission[]) => {
  const totalDocuments = submissions.length;
  const approvedDocuments = submissions.filter(doc => doc.status === 'APPROVED').length;
  const completionPercentage = totalDocuments === 0 ? 0 : (approvedDocuments / totalDocuments) * 100;

  return {
    totalDocuments,
    approvedDocuments,
    completionPercentage
  };
};
