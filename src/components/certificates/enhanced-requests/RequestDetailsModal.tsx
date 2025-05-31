
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Clock,
  FileText
} from 'lucide-react';

interface RequestDetailsModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  canManage: boolean;
}

export function RequestDetailsModal({
  requestId,
  isOpen,
  onClose,
  onApprove,
  onReject,
  canManage
}: RequestDetailsModalProps) {
  // This would normally fetch the request details by ID
  // For now, we'll use mock data
  const request = {
    id: requestId,
    recipientName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    company: 'ABC Corporation',
    courseName: 'Standard First Aid & CPR-C',
    locationName: 'Toronto Training Center',
    instructorName: 'Jane Smith',
    firstAidLevel: 'STANDARD',
    cprLevel: 'C',
    assessmentStatus: 'PASS',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    status: 'PENDING',
    submittedBy: 'admin@company.com',
    submittedAt: '2024-01-10T09:00:00Z',
    batchId: 'batch-123',
    batchName: 'January 2024 Batch'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Certificate Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{request.recipientName}</h2>
              <Badge variant={request.assessmentStatus === 'PASS' ? 'default' : 'destructive'}>
                {request.assessmentStatus}
              </Badge>
              <Badge variant="outline">
                {request.status}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.recipientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.email}</span>
              </div>
              {request.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{request.phone}</span>
                </div>
              )}
              {request.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{request.company}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Course Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Course Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.courseName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm">{request.locationName}</span>
              </div>
              {request.instructorName && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Instructor: {request.instructorName}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Certification Details */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Certification Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Issue Date: {new Date(request.issueDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm">Expiry Date: {new Date(request.expiryDate).toLocaleDateString()}</span>
              </div>
              {request.firstAidLevel && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">First Aid: {request.firstAidLevel}</Badge>
                </div>
              )}
              {request.cprLevel && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">CPR: {request.cprLevel}</Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Submission Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Submission Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  Submitted: {new Date(request.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm">By: {request.submittedBy}</span>
              </div>
              {request.batchName && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">Batch: {request.batchName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {canManage && request.status === 'PENDING' && (
            <div className="flex gap-3 pt-4">
              {request.assessmentStatus !== 'FAIL' && (
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
                onClick={() => onReject('Manual rejection from details view')}
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject Request
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
