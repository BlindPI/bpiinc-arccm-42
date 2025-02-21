
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';

interface RequestCardProps {
  request: any;
  isProcessed?: boolean;
  onUpdateRequest: (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED'; 
    rejectionReason?: string 
  }) => void;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  isPending: boolean;
}

export const RequestCard = ({ 
  request, 
  isProcessed = false,
  onUpdateRequest,
  selectedRequestId,
  setSelectedRequestId,
  rejectionReason,
  setRejectionReason,
  isPending
}: RequestCardProps) => {
  return (
    <Alert key={request.id} variant="outline" className="relative">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <AlertTitle className="flex items-center gap-2">
              {request.recipient_name}
              <StatusBadge status={request.status} />
            </AlertTitle>
            <AlertDescription>
              <div className="space-y-1 mt-2">
                <p><strong>Course:</strong> {request.course_name}</p>
                <p><strong>Issue Date:</strong> {request.issue_date}</p>
                <p><strong>Expiry Date:</strong> {request.expiry_date}</p>
                {request.rejection_reason && (
                  <p className="text-destructive">
                    <strong>Rejection Reason:</strong> {request.rejection_reason}
                  </p>
                )}
              </div>
            </AlertDescription>
          </div>
        </div>

        {!isProcessed && selectedRequestId === request.id && (
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Rejection Reason</Label>
            <Input
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection"
            />
          </div>
        )}
        
        {!isProcessed && (
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => onUpdateRequest({ 
                id: request.id, 
                status: 'APPROVED' 
              })}
              disabled={isPending}
            >
              <Check className="mr-2 h-4 w-4" />
              Approve
            </Button>
            {selectedRequestId === request.id ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (!rejectionReason) {
                    toast.error('Please provide a rejection reason');
                    return;
                  }
                  onUpdateRequest({ 
                    id: request.id, 
                    status: 'REJECTED',
                    rejectionReason 
                  });
                }}
                disabled={isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Confirm Rejection
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequestId(request.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
          </div>
        )}
      </div>
    </Alert>
  );
};
