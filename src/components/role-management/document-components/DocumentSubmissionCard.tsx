
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { FileIcon, Upload } from 'lucide-react';
import { DocumentStatusBadge } from './DocumentStatusBadge';
import { DocumentUploadForm } from './DocumentUploadForm';
import { DocumentReviewInterface } from '../DocumentReviewInterface';
import { DocumentSubmission } from '@/types/user-management';

interface DocumentSubmissionCardProps {
  submission: DocumentSubmission;
  canReviewDocuments: boolean;
  onUpload: (requirementId: string, file: File) => Promise<void>;
  onReviewComplete: () => void;
}

export function DocumentSubmissionCard({
  submission,
  canReviewDocuments,
  onUpload,
  onReviewComplete
}: DocumentSubmissionCardProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);

  const documentType = submission.document_requirements?.document_type || 'Document';
  const isMandatory = submission.document_requirements?.is_mandatory || false;
  const hasSubmission = !!submission.document_url;
  const isPending = submission.status === 'PENDING';
  const isRejected = submission.status === 'REJECTED';
  const isApproved = submission.status === 'APPROVED';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
          <div>
            <h3 className="font-medium flex items-center gap-1.5">
              <FileIcon className="h-4 w-4 text-muted-foreground" />
              {documentType}
            </h3>
            {isMandatory && (
              <Badge variant="outline" className="mt-1">Required</Badge>
            )}
          </div>
          <DocumentStatusBadge status={submission.status} />
        </div>

        {/* Feedback display */}
        {submission.feedback && (
          <div className="mb-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-medium mb-1">Feedback:</p>
            <p>{submission.feedback}</p>
          </div>
        )}

        {/* Expiry date display */}
        {submission.expiry_date && (
          <div className="mb-4 text-sm">
            <p>
              <span className="font-medium">Expiry date:</span> {format(new Date(submission.expiry_date), 'PPP')}
            </p>
          </div>
        )}

        {/* Document preview or review controls */}
        {hasSubmission ? (
          <>
            <div className="mb-4">
              <a 
                href={submission.document_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
              >
                <FileIcon className="h-4 w-4" />
                View Document
              </a>
            </div>
            {canReviewDocuments && isPending && (
              <DocumentReviewInterface 
                submission={{
                  id: submission.id,
                  status: submission.status,
                  document_url: submission.document_url || '',
                  feedback_text: submission.feedback
                }}
                onReviewComplete={onReviewComplete} 
              />
            )}
          </>
        ) : (
          <div className="space-y-3">
            {showUploadForm ? (
              <DocumentUploadForm
                onUpload={(file) => onUpload(submission.requirement_id, file)}
                onCancel={() => setShowUploadForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowUploadForm(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            )}
          </div>
        )}

        {/* Replace document button */}
        {hasSubmission && (isRejected || (!isPending && !isApproved)) && (
          <div className="mt-4">
            {showUploadForm ? (
              <DocumentUploadForm
                onUpload={(file) => onUpload(submission.requirement_id, file)}
                onCancel={() => setShowUploadForm(false)}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowUploadForm(true)}
              >
                <Upload className="mr-2 h-3 w-3" />
                Replace Document
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
