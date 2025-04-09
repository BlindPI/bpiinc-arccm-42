import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DocumentSubmission } from "@/types/user-management";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "./DocumentStatusBadge";
import { Loader2, FileText, Upload, Download, CheckCircle, XCircle } from "lucide-react";
import { DocumentUploadForm } from "./DocumentUploadForm";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DocumentSubmissionCardProps {
  submission: DocumentSubmission;
  canReviewDocuments: boolean;
  onUpload: (requirementId: string, file: File) => Promise<void>;
  onReviewComplete?: () => void;
}

export const DocumentSubmissionCard = ({ 
  submission, 
  canReviewDocuments,
  onUpload,
  onReviewComplete 
}: DocumentSubmissionCardProps) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [feedback, setFeedback] = useState(submission.feedback || "");
  const queryClient = useQueryClient();

  const reviewDocument = useMutation({
    mutationFn: async ({ decision, feedback }: { decision: 'APPROVED' | 'REJECTED', feedback: string }) => {
      if (!user) {
        throw new Error('You must be logged in to review documents');
      }

      const { error } = await supabase
        .from('document_submissions')
        .update({ 
          status: decision,
          reviewer_id: user.id,
          reviewed_at: new Date().toISOString(),
          feedback: feedback.trim() || null
        })
        .eq('id', submission.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
      toast.success('Document reviewed successfully');
      setIsReviewing(false);
      onReviewComplete?.();
    },
    onError: (error) => {
      toast.error(`Error reviewing document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      await onUpload(submission.requirement_id, file);
    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReview = (decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !feedback.trim()) {
      toast.error('Please provide feedback for rejection');
      return;
    }

    reviewDocument.mutate({ decision, feedback });
  };

  const downloadDocument = async () => {
    if (!submission.document_url) {
      toast.error('No document available to download');
      return;
    }

    try {
      window.open(submission.document_url, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">
          {submission.document_requirements.document_type}
        </CardTitle>
        <CardDescription>
          {submission.document_requirements.description || "Required document for role transition"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <DocumentStatusBadge status={submission.status} />
          {submission.status === 'REJECTED' && submission.feedback && (
            <div className="text-sm text-muted-foreground mt-2">
              <p className="font-medium">Feedback:</p>
              <p>{submission.feedback}</p>
            </div>
          )}
        </div>
        
        {isReviewing && (
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Provide feedback (required for rejection)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => handleReview('APPROVED')}
                disabled={reviewDocument.isPending}
              >
                {reviewDocument.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Approve
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleReview('REJECTED')}
                disabled={reviewDocument.isPending}
              >
                {reviewDocument.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsReviewing(false)}
                disabled={reviewDocument.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-0">
        {!submission.document_url ? (
          <DocumentUploadForm onFileSelected={handleFileUpload} isUploading={isUploading} />
        ) : (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={downloadDocument}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {(submission.status === 'REJECTED' || submission.document_requirements.is_mandatory) && (
              <Button variant="outline" size="sm" onClick={() => setIsUploading(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Replace
              </Button>
            )}
          </div>
        )}
        
        {canReviewDocuments && submission.document_url && submission.status === 'PENDING' && (
          <Button variant="default" size="sm" onClick={() => setIsReviewing(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Review
          </Button>
        )}
      </CardFooter>
      
      {isUploading && (
        <DocumentUploadForm
          onFileSelected={handleFileUpload}
          isUploading={isUploading}
          onCancel={() => setIsUploading(false)}
          showModal={true}
        />
      )}
    </Card>
  );
};
