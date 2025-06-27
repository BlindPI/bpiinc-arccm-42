// File: src/components/compliance/RequirementReviewQueue.tsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';
import { useSubmissionsToReview, useRequirementReview } from '../../hooks/useComplianceRequirements';
import { format } from 'date-fns';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Loader2, InboxIcon, FileIcon, UserIcon, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function RequirementReviewQueue() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [filters, setFilters] = useState({
    requirementType: 'all',
    dateRange: 'week'
  });
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  const { data: submissionsToReview, isLoading, refetch } = useSubmissionsToReview(
    filters,
    profile?.role
  );
  
  const openReviewDialog = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submissions Awaiting Review</CardTitle>
          <CardDescription>
            Review and approve compliance requirement submissions
          </CardDescription>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Select
              value={filters.requirementType}
              onValueChange={(value) => 
                setFilters({ ...filters, requirementType: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Requirement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="certification">Certifications</SelectItem>
                <SelectItem value="assessment">Assessments</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.dateRange}
              onValueChange={(value) => 
                setFilters({ ...filters, dateRange: value })
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : submissionsToReview?.length === 0 ? (
            <div className="text-center py-8">
              <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">
                No submissions waiting for review
              </p>
            </div>
          ) : (
           <div className="space-y-4">
             {(() => {
               console.log('🐛 REVIEW-MAP-DEBUG: About to map submissionsToReview:', {
                 submissionsToReview: submissionsToReview,
                 isArray: Array.isArray(submissionsToReview),
                 length: submissionsToReview?.length,
                 type: typeof submissionsToReview
               });
               
               if (!Array.isArray(submissionsToReview)) {
                 console.error('🔥 REVIEW-MAP-ERROR: submissionsToReview is not an array!', submissionsToReview);
                 return <div className="text-red-500">Error: Submissions data is not properly loaded</div>;
               }
               
               return submissionsToReview.map((submission) => (
                 <SubmissionReviewCard
                   key={submission.id}
                   submission={submission}
                   onReview={() => openReviewDialog(submission)}
                 />
               ));
             })()}
           </div>
         )}
        </CardContent>
      </Card>
      
      {selectedSubmission && (
        <SubmissionReviewDialog
          submission={selectedSubmission}
          isOpen={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          onComplete={() => {
            setReviewDialogOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function SubmissionReviewCard({ submission, onReview }: { submission: any; onReview: () => void }) {
  const typeIcons: Record<string, React.ReactNode> = {
    document: <FileIcon className="h-4 w-4 text-blue-500" />,
    training: <UserIcon className="h-4 w-4 text-green-500" />,
    certification: <CheckCircle className="h-4 w-4 text-purple-500" />,
    assessment: <AlertTriangle className="h-4 w-4 text-amber-500" />
  };
  
  const icon = typeIcons[submission.requirement_type] || <FileIcon className="h-4 w-4 text-gray-500" />;
  
  return (
    <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <h3 className="font-medium">{submission.requirement_name}</h3>
            <p className="text-sm text-muted-foreground">
              Submitted by {submission.user_name} ({submission.user_role}) on{' '}
              {format(new Date(submission.submitted_at), 'PPP')}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="capitalize">
          {submission.requirement_type}
        </Badge>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {(() => {
          console.log('🐛 FILES-MAP-DEBUG: About to map submission.files:', {
            files: submission.files,
            isArray: Array.isArray(submission.files),
            length: submission.files?.length,
            type: typeof submission.files
          });
          
          if (!submission.files || !Array.isArray(submission.files)) {
            return null;
          }
          
          return submission.files.map((file: any, i: number) => (
            <a
              key={i}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs p-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              <FileIcon className="h-3 w-3" />
              {file.name}
            </a>
          ));
        })()}
      </div>
      
      {submission.notes && (
        <p className="mt-2 text-sm bg-gray-50 p-2 rounded">
          {submission.notes}
        </p>
      )}
      
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onReview}>
          Review
        </Button>
      </div>
    </div>
  );
}

function SubmissionReviewDialog({ 
  submission, 
  isOpen, 
  onClose, 
  onComplete 
}: { 
  submission: any; 
  isOpen: boolean; 
  onClose: () => void; 
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewTab, setReviewTab] = useState('files');
  const { mutate: reviewSubmission, isPending: isSubmitting } = useRequirementReview();
  
  const handleApprove = () => {
    if (!user?.id) {
      toast.error('You must be logged in to approve submissions');
      return;
    }
    
    reviewSubmission({
      submissionId: submission.id,
      reviewerId: user.id,
      decision: 'approve',
      reviewData: {
        notes: reviewNotes,
        metadata: {
          approved_at: new Date().toISOString(),
          reviewer_name: user.name || user.email
        }
      }
    }, {
      onSuccess: () => {
        toast.success(`Requirement approved for ${submission.user_name}`);
        onComplete();
      }
    });
  };
  
  const handleReject = () => {
    if (!user?.id) {
      toast.error('You must be logged in to reject submissions');
      return;
    }
    
    if (!reviewNotes.trim()) {
      toast.error('Please provide feedback when rejecting a submission');
      return;
    }
    
    reviewSubmission({
      submissionId: submission.id,
      reviewerId: user.id,
      decision: 'reject',
      reviewData: {
        notes: reviewNotes,
        metadata: {
          rejected_at: new Date().toISOString(),
          reviewer_name: user.name || user.email
        }
      }
    }, {
      onSuccess: () => {
        toast.success(`Requirement returned to ${submission.user_name} for revision`);
        onComplete();
      }
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Submission</DialogTitle>
          <DialogDescription>
            Reviewing {submission.requirement_name} from {submission.user_name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Tabs value={reviewTab} onValueChange={setReviewTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="files">Files & Data</TabsTrigger>
              <TabsTrigger value="details">Requirement Details</TabsTrigger>
              <TabsTrigger value="user">User Information</TabsTrigger>
            </TabsList>
            
            <TabsContent value="files">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Submitted Files</h3>
                
                {submission.files && submission.files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(() => {
                      console.log('🐛 DIALOG-FILES-MAP-DEBUG: About to map submission.files:', {
                        files: submission.files,
                        isArray: Array.isArray(submission.files),
                        length: submission.files?.length,
                        type: typeof submission.files
                      });
                      
                      if (!Array.isArray(submission.files)) {
                        console.error('🔥 DIALOG-FILES-MAP-ERROR: submission.files is not an array!', submission.files);
                        return <div className="text-red-500">Error: Files data is not properly loaded</div>;
                      }
                      
                      return submission.files.map((file: any, i: number) => (
                      <a
                        key={i}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <FileIcon className="h-5 w-5 mr-2 text-blue-500" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <span className="text-xs text-blue-600">View</span>
                      </a>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No files were submitted</p>
                )}
                
                {submission.submission_data && Object.keys(submission.submission_data).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-2">Submission Data</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(submission.submission_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                
                {submission.notes && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Submission Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm">{submission.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-xs font-medium text-gray-500">Requirement Type</h3>
                    <p className="mt-1 capitalize">{submission.requirement_type}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-xs font-medium text-gray-500">Submission Date</h3>
                    <p className="mt-1">{format(new Date(submission.submitted_at), 'PPP p')}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-xs font-medium text-gray-500">Requirement Details</h3>
                  <p className="mt-1 text-sm">{submission.requirement_name}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="user">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-xs font-medium text-gray-500">User Name</h3>
                    <p className="mt-1">{submission.user_name}</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-xs font-medium text-gray-500">User Role</h3>
                    <p className="mt-1">{submission.user_role}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-xs font-medium text-gray-500">Email</h3>
                  <p className="mt-1">{submission.user_email}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium">Review Notes</h3>
            <Textarea
              placeholder="Add your review notes or feedback here..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
            Return for Revision
          </Button>
          
          <Button
            variant="default"
            onClick={handleApprove}
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RequirementReviewQueue;