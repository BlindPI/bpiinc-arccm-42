
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DocumentReviewInterfaceProps {
  submission: {
    id: string;
    status: string;
    document_url: string;
    feedback_text?: string;
  };
  onReviewComplete: () => void;
}

export const DocumentReviewInterface = ({ submission, onReviewComplete }: DocumentReviewInterfaceProps) => {
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [feedback, setFeedback] = useState(submission.feedback_text || '');
  const queryClient = useQueryClient();

  const { mutate: submitReview, isPending } = useMutation({
    mutationFn: async () => {
      if (!reviewAction) return;
      
      const { error } = await supabase
        .from('document_submissions')
        .update({
          status: reviewAction,
          feedback: feedback,
          reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Review submitted successfully');
      setIsReviewDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['document-submissions'] });
      onReviewComplete();
    },
    onError: (error) => {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    },
  });

  const handleReviewClick = (action: 'APPROVED' | 'REJECTED') => {
    setReviewAction(action);
    setIsReviewDialogOpen(true);
  };

  if (submission.status !== 'PENDING') {
    return null;
  }

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => handleReviewClick('APPROVED')}
        >
          <CheckCircle className="h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleReviewClick('REJECTED')}
        >
          <XCircle className="h-4 w-4" />
          Reject
        </Button>
      </div>

      <AlertDialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {reviewAction === 'APPROVED' ? 'Approve Document' : 'Reject Document'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {reviewAction === 'APPROVED'
                ? 'Are you sure you want to approve this document? You can provide optional feedback below.'
                : 'Please provide feedback explaining why this document is being rejected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback..."
              className="min-h-[100px]"
              required={reviewAction === 'REJECTED'}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitReview()}
              disabled={isPending || (reviewAction === 'REJECTED' && !feedback.trim())}
              className={reviewAction === 'APPROVED' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isPending ? 'Submitting...' : reviewAction === 'APPROVED' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
