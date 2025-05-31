
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  MapPin, 
  GraduationCap, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { EnhancedCertificateRequest } from '@/types/certificateValidation';

interface RequestDetailsModalProps {
  request: EnhancedCertificateRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function RequestDetailsModal({
  request,
  onClose,
  onApprove,
  onReject
}: RequestDetailsModalProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason.trim());
    }
  };

  const canBeApproved = request.assessmentStatus !== 'FAIL';

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Certificate Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-lg">{request.recipientName}</h3>
              <p className="text-sm text-gray-600">{request.email}</p>
            </div>
            <div className="flex gap-2">
              <Badge variant={request.assessmentStatus === 'PASS' ? 'default' : 'destructive'}>
                {request.assessmentStatus}
              </Badge>
              <Badge variant="outline">
                {request.status}
              </Badge>
            </div>
          </div>

          {/* Request Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Personal Information</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{request.email}</span>
              </div>
              
              {request.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{request.phone}</span>
                </div>
              )}
              
              {request.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{request.company}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{request.locationName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Course Information</h4>
              
              <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span>{request.courseName}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Issue: {new Date(request.issueDate).toLocaleDateString()}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Expires: {new Date(request.expiryDate).toLocaleDateString()}</span>
              </div>
              
              {request.instructorName && (
                <div className="text-sm">
                  <span className="font-medium">Instructor:</span> {request.instructorName}
                </div>
              )}
            </div>
          </div>

          {/* Certification Levels */}
          {(request.firstAidLevel || request.cprLevel) && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Certification Levels</h4>
              <div className="flex gap-2">
                {request.firstAidLevel && (
                  <Badge variant="outline">First Aid: {request.firstAidLevel}</Badge>
                )}
                {request.cprLevel && (
                  <Badge variant="outline">CPR: {request.cprLevel}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {request.validationErrors && request.validationErrors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="font-medium text-red-800">Validation Issues</h4>
              </div>
              <ul className="space-y-1">
                {request.validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-600">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rejection Reason */}
          {request.rejectionReason && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
              <p className="text-sm text-red-600">{request.rejectionReason}</p>
            </div>
          )}

          {/* Rejection Form */}
          {showRejectForm && (
            <div className="space-y-3">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {/* Actions */}
          {request.status === 'PENDING' && (
            <div className="flex gap-3 pt-4 border-t">
              {!showRejectForm ? (
                <>
                  {canBeApproved && (
                    <Button
                      onClick={onApprove}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Request
                    </Button>
                  )}
                  
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectForm(true)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Request
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Confirm Rejection
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason('');
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
              
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
