
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  AlertTriangle 
} from 'lucide-react';
import { useSubmissionsToReview } from '@/hooks/useSubmissionsToReview';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function RequirementReviewQueue() {
  const { data: submissions, isLoading, error } = useSubmissionsToReview();
  const queryClient = useQueryClient();

  const { mutate: reviewSubmission } = useMutation({
    mutationFn: async ({ 
      submissionId, 
      action, 
      notes 
    }: { 
      submissionId: string; 
      action: 'approve' | 'reject'; 
      notes?: string;
    }) => {
      const { error } = await supabase
        .from('user_compliance_records')
        .update({
          compliance_status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewer_id: (await supabase.auth.getUser()).data.user?.id,
          review_notes: notes
        })
        .eq('id', submissionId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Submission ${variables.action}d successfully`);
      queryClient.invalidateQueries({ queryKey: ['submissions-to-review'] });
      queryClient.invalidateQueries({ queryKey: ['compliance-admin-stats'] });
    },
    onError: (error) => {
      toast.error(`Failed to review submission: ${error.message}`);
    }
  });

  if (isLoading) {
    return <ReviewQueueSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-500">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load review queue</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Review Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No submissions pending review at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Review Queue ({submissions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{submission.user_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{submission.metric_name}</span>
                  </div>
                </div>
                <Badge variant="outline" className="bg-orange-50">
                  <Clock className="h-3 w-3 mr-1" />
                  Pending
                </Badge>
              </div>

              {submission.current_value && (
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-sm font-medium mb-1">Submitted Value:</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.current_value}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700"
                    onClick={() => reviewSubmission({
                      submissionId: submission.id,
                      action: 'approve'
                    })}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => reviewSubmission({
                      submissionId: submission.id,
                      action: 'reject'
                    })}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewQueueSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
