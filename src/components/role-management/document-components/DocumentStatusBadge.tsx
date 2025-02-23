
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface DocumentStatusBadgeProps {
  status: string;
}

export const DocumentStatusBadge = ({ status }: DocumentStatusBadgeProps) => {
  switch (status) {
    case 'APPROVED':
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Approved</span>
        </div>
      );
    case 'REJECTED':
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-4 w-4" />
          <span>Rejected</span>
        </div>
      );
    case 'PENDING':
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <Clock className="h-4 w-4" />
          <span>Pending Review</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-2 text-gray-600">
          <AlertCircle className="h-4 w-4" />
          <span>Missing</span>
        </div>
      );
  }
};
