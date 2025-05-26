
import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Award, CheckCircle, CircleSlash, X, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CertificateRequest } from '@/types/supabase-schema';

interface RequestCardProps {
  request: CertificateRequest;
  onUpdateRequest: (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED'; 
    rejectionReason?: string 
  }) => Promise<void>; // Changed to Promise<void>
  isPending: boolean;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onUpdateRequest,
  isPending,
  selectedRequestId,
  setSelectedRequestId,
  rejectionReason,
  setRejectionReason
}) => {
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const isRejectingThis = selectedRequestId === request.id;
  const canApprove = request.assessment_status !== 'FAIL';
  
  const handleRejectClick = () => {
    setSelectedRequestId(request.id);
    setIsRejectionDialogOpen(true);
  };
  
  const handleRejectConfirm = async () => {
    try {
      await onUpdateRequest({
        id: request.id,
        status: 'REJECTED',
        rejectionReason
      });
      
      // Close dialog and reset after operation completes
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    } catch (error) {
      console.error('Error confirming rejection:', error);
    }
  };
  
  const handleApproveClick = async () => {
    try {
      console.log('Approving request:', request.id);
      await onUpdateRequest({
        id: request.id,
        status: 'APPROVED'
      });
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };
  
  return (
    <>
      <Card className="border rounded-md shadow-sm">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-md">{request.recipient_name}</span>
                
                {request.assessment_status === 'FAIL' ? (
                  <Badge variant="destructive" className="text-xs">Failed Assessment</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground mt-1">
                <span>{request.course_name}</span>
              </div>
              
              <div className="mt-2 text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-muted-foreground">Issue Date:</span> {request.issue_date}
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry Date:</span> {request.expiry_date}
                </div>
                {request.email && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Email:</span> {request.email}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {request.assessment_status === 'FAIL' ? (
                <AlertCircle className="h-5 w-5 text-destructive" />
              ) : (
                <FileText className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gray-50 p-3 flex justify-end gap-2">
          {request.assessment_status === 'FAIL' ? (
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                await onUpdateRequest({
                  id: request.id,
                  status: 'ARCHIVE_FAILED'
                });
              }}
              disabled={isPending}
            >
              <CircleSlash className="h-4 w-4 mr-2" />
              Archive
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                size="sm"
                className="border-red-200 hover:bg-red-50 text-red-600"
                onClick={handleRejectClick}
                disabled={isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="border-green-200 hover:bg-green-50 text-green-600"
                onClick={handleApproveClick}
                disabled={isPending || !canApprove}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Certificate Request</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-3 text-sm">
              Please provide a reason for rejecting this certificate request for <strong>{request.recipient_name}</strong>.
            </p>
            <Textarea
              placeholder="Reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectionDialogOpen(false);
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason || isPending}
            >
              {isPending ? 'Rejecting...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
