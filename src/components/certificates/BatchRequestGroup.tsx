
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ChevronDown, ChevronUp, FileBadge, AlertTriangle, CheckCheck, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { RequestCard } from './RequestCard';
import { format } from 'date-fns';
import { CertificateRequest } from '@/types/supabase-schema';

interface BatchRequestGroupProps {
  requests: CertificateRequest[];
  batchId: string;
  submittedBy?: string;
  submittedAt?: string;
  isPending: boolean;
  onUpdateRequest: (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED'; 
    rejectionReason?: string 
  }) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export const BatchRequestGroup: React.FC<BatchRequestGroupProps> = ({
  requests,
  batchId,
  submittedBy = 'Unknown',
  submittedAt,
  isPending,
  onUpdateRequest,
  selectedRequestId,
  setSelectedRequestId,
  rejectionReason,
  setRejectionReason
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Calculate batch statistics
  const totalRequests = requests.length;
  const failedAssessments = requests.filter(req => req.assessment_status === 'FAIL').length;
  const passedAssessments = requests.filter(req => req.assessment_status === 'PASS').length;
  const pendingAssessments = totalRequests - (failedAssessments + passedAssessments);
  
  // Only requests that can be approved (not failed assessments)
  const approvableRequests = requests.filter(req => req.assessment_status !== 'FAIL');

  const handleBatchApprove = async () => {
    if (approvableRequests.length === 0) {
      toast.error('No eligible requests to approve in this batch');
      return;
    }

    try {
      setIsBatchProcessing(true);
      
      // Process batch sequentially to prevent overloading the system
      let successful = 0;
      for (const request of approvableRequests) {
        try {
          // Individual approvals
          await new Promise(resolve => {
            onUpdateRequest({ 
              id: request.id, 
              status: 'APPROVED' 
            });
            setTimeout(resolve, 300); // Small delay between operations
          });
          successful++;
        } catch (error) {
          console.error(`Error approving request ${request.id}:`, error);
          // Continue with other requests even if one fails
        }
      }
      
      toast.success(`Processed ${successful} of ${approvableRequests.length} requests in this batch`);
    } catch (error) {
      console.error('Error in batch approval:', error);
      toast.error('Error processing batch approval');
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleArchiveFailedAssessments = async () => {
    if (failedAssessments === 0) {
      toast.info('No failed assessments in this batch');
      return;
    }
    
    try {
      setIsBatchProcessing(true);
      
      // Get all failed assessment requests
      const failedRequests = requests.filter(req => req.assessment_status === 'FAIL');
      
      // Process batch sequentially
      let archived = 0;
      for (const request of failedRequests) {
        try {
          // Archive each failed assessment
          await new Promise(resolve => {
            onUpdateRequest({ 
              id: request.id, 
              status: 'ARCHIVE_FAILED' 
            });
            setTimeout(resolve, 300); // Small delay between operations
          });
          archived++;
        } catch (error) {
          console.error(`Error archiving request ${request.id}:`, error);
          // Continue with other requests even if one fails
        }
      }
      
      toast.success(`Archived ${archived} of ${failedAssessments} failed assessments`);
    } catch (error) {
      console.error('Error in batch archival:', error);
      toast.error('Error archiving failed assessments');
    } finally {
      setIsBatchProcessing(false);
    }
  };
  
  const formatBatchDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };
  
  return (
    <Card className="mb-4 border-2 shadow-sm hover:shadow-md transition-shadow">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">Toggle batch details</span>
                </Button>
              </CollapsibleTrigger>
              
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-primary" />
                <span>Batch Submission</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {totalRequests} {totalRequests === 1 ? 'request' : 'requests'}
                </Badge>
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-3">
              {passedAssessments > 0 && (
                <Badge variant="success" className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {passedAssessments} Passed
                </Badge>
              )}
              
              {failedAssessments > 0 && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {failedAssessments} Failed
                </Badge>
              )}
              
              {pendingAssessments > 0 && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {pendingAssessments} Pending
                </Badge>
              )}
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground mt-1">
            <span>Submitted by: {submittedBy}</span>
            <span className="mx-2">•</span>
            <span>Date: {formatBatchDate(submittedAt)}</span>
          </div>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {requests.map(request => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onUpdateRequest={onUpdateRequest}
                  selectedRequestId={selectedRequestId}
                  setSelectedRequestId={setSelectedRequestId}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                  isPending={isPending}
                />
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
        
        <CardFooter className="bg-gray-50/50 border-t flex justify-between py-3">
          <div className="text-sm text-muted-foreground">
            {isOpen ? 'Click to collapse' : 'Click to expand'} {totalRequests} requests
          </div>
          
          <div className="flex items-center gap-2">
            {failedAssessments > 0 && (
              <Button
                variant="outline"
                size="sm"
                disabled={isBatchProcessing}
                onClick={handleArchiveFailedAssessments}
                className="text-amber-600 border-amber-200 hover:bg-amber-50"
              >
                {isBatchProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Archive Failed ({failedAssessments})
                  </>
                )}
              </Button>
            )}
            
            {approvableRequests.length > 0 && (
              <Button
                variant="default"
                size="sm"
                disabled={isBatchProcessing}
                onClick={handleBatchApprove}
              >
                {isBatchProcessing ? (
                  <>Processing...</>
                ) : (
                  <>
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Approve All ({approvableRequests.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Collapsible>
    </Card>
  );
};
