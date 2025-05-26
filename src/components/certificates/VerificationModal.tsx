import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { format } from 'date-fns';
import { ScrollArea } from '../ui/scroll-area';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: any;
}

export const VerificationModal = ({
  isOpen,
  onClose,
  request
}: VerificationModalProps) => {
  // Function to get proper status badge with correct formatting
  const getStatusBadge = (status: string | undefined | null) => {
    const statusValue = status || 'UNKNOWN';
    
    switch (statusValue.toUpperCase()) {
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'ARCHIVED':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Archived</Badge>;
      case 'PENDING':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>;
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Expired</Badge>;
      case 'REVOKED':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
          {statusValue === 'UNKNOWN' ? 'Unknown' : statusValue}
        </Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Certificate Request Details</DialogTitle>
          <DialogDescription>
            Verify the details of the certificate request
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full pr-4">
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <p className="font-medium">{request.recipient_name || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="font-medium">{request.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Phone</label>
                  <p className="font-medium">{request.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Company</label>
                  <p className="font-medium">{request.company || 'Not provided'}</p>
                </div>
              </div>
            </div>

            {/* Course Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Course Information</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <label className="text-sm text-muted-foreground">Course Name</label>
                  <p className="font-medium">{request.course_name || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(request.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{request.issue_date || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Expiry Date</label>
                  <p className="font-medium">{request.expiry_date || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Assessment Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Assessment Details</h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/50 p-4 rounded-lg">
                <div>
                  <label className="text-sm text-muted-foreground">Assessment Status</label>
                  <p className="font-medium">{request.assessment_status || 'Not applicable'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">First Aid Level</label>
                  <p className="font-medium">{request.first_aid_level || 'Not applicable'}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">CPR Level</label>
                  <p className="font-medium">{request.cpr_level || 'Not applicable'}</p>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Validation Summary</h3>
              <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${request.recipient_name ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Recipient Name: {request.recipient_name ? 'Provided' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${request.course_name ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Course Name: {request.course_name ? 'Provided' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${request.issue_date ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Issue Date: {request.issue_date ? 'Provided' : 'Missing'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${request.expiry_date ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span>Expiry Date: {request.expiry_date ? 'Provided' : 'Missing'}</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};