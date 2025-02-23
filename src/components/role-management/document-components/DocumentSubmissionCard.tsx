
import { FileIcon } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentUploadForm } from './DocumentUploadForm';
import { DocumentReviewInterface } from '../DocumentReviewInterface';
import type { DocumentSubmission } from '@/types/user-management';

interface DocumentSubmissionCardProps {
  submission: DocumentSubmission;
  canReviewDocuments: boolean;
  onUpload: (requirementId: string, file: File) => Promise<void>;
  onReviewComplete: () => void;
}

export const DocumentSubmissionCard = ({
  submission,
  canReviewDocuments,
  onUpload,
  onReviewComplete
}: DocumentSubmissionCardProps) => {
  return (
    <div key={submission.id} className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">
            {submission.document_requirements.document_type}
          </h4>
          {submission.document_requirements.is_mandatory && (
            <span className="text-xs text-red-600">Required</span>
          )}
        </div>
        <DocumentStatusBadge status={submission.status} />
      </div>
      
      {submission.document_url && (
        <div className="flex items-center gap-2">
          <FileIcon className="h-4 w-4" />
          <a 
            href={submission.document_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline"
          >
            View Document
          </a>
        </div>
      )}

      {submission.feedback_text && (
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-sm text-gray-600">{submission.feedback_text}</p>
        </div>
      )}

      {submission.expiry_date && (
        <div className="text-sm text-gray-600">
          Expires: {new Date(submission.expiry_date).toLocaleDateString()}
        </div>
      )}

      {canReviewDocuments && (
        <DocumentReviewInterface 
          submission={submission} 
          onReviewComplete={onReviewComplete}
        />
      )}

      <DocumentUploadForm
        submissionId={submission.id}
        requirementId={submission.document_requirements.id}
        onUpload={onUpload}
      />
    </div>
  );
};
