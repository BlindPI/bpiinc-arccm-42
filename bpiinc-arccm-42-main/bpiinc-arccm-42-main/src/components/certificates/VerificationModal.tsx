
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
                  <p className="font-medium">{request.recipient_name}</p>
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
                  <p className="font-medium">{request.course_name}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Badge variant="outline" className="mt-1">
                    {request.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Issue Date</label>
                  <p className="font-medium">{request.issue_date}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Expiry Date</label>
                  <p className="font-medium">{request.expiry_date}</p>
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
