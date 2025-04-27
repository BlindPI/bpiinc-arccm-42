import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, X, FileSearch } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { VerificationModal } from './VerificationModal';
import { format, isValid, parseISO, parse } from 'date-fns';

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
  const [isVerificationModalOpen, setIsVerificationModalOpen] = React.useState(false);

  const formatDateIfNeeded = (dateString: string): string => {
    if (dateString && dateString.match(/^[A-Z][a-z]+ \d{1,2}, \d{4}$/)) {
      return dateString;
    }
    
    try {
      let date;
      if (dateString.includes('T') || dateString.includes('-')) {
        date = parseISO(dateString);
      } else {
        const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'M/d/yyyy'];
        
        for (const fmt of formats) {
          const parsed = parse(dateString, fmt, new Date());
          if (isValid(parsed)) {
            date = parsed;
            break;
          }
        }
      }
      
      if (date && isValid(date)) {
        return format(date, 'MMMM d, yyyy');
      }
    } catch (error) {
      console.error('Error formatting date:', error);
    }
    
    return dateString;
  };

  return (
    <>
      <Alert 
        key={request.id} 
        variant="outline" 
        className="relative transition-all duration-200 hover:shadow-md bg-card border-muted"
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <AlertTitle className="flex items-center gap-2 text-lg font-semibold">
                {request.recipient_name}
                <StatusBadge status={request.status} />
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-3">
                  <p className="text-sm"><strong className="text-secondary">Course:</strong> {request.course_name}</p>
                  <p className="text-sm"><strong className="text-secondary">Issue Date:</strong> {formatDateIfNeeded(request.issue_date)}</p>
                  <p className="text-sm"><strong className="text-secondary">Expiry Date:</strong> {formatDateIfNeeded(request.expiry_date)}</p>
                  {request.rejection_reason && (
                    <p className="text-sm text-destructive mt-2 p-2 bg-destructive/10 rounded-md">
                      <strong>Rejection Reason:</strong> {request.rejection_reason}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVerificationModalOpen(true)}
              className="text-muted-foreground hover:text-primary hover:bg-accent"
            >
              <FileSearch className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>

          {!isProcessed && selectedRequestId === request.id && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <Label htmlFor="rejectionReason" className="text-sm font-medium">
                Rejection Reason
              </Label>
              <Input
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection"
                className="bg-background"
              />
            </div>
          )}
          
          {!isProcessed && (
            <div className="flex gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdateRequest({ 
                  id: request.id, 
                  status: 'APPROVED' 
                })}
                disabled={isPending}
                className="bg-primary hover:bg-primary/90"
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
                  className="hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              )}
            </div>
          )}
        </div>
      </Alert>

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        request={request}
      />
    </>
  );
};
