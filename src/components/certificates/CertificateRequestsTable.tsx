
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Trash2, Eye, Package, MapPin, User, Award, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

interface CertificateRequestsTableProps {
  requests: any[];
  isLoading: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onDeleteRequest: (id: string) => Promise<void>;
  isDeleting: boolean;
  showBatchInfo?: boolean;
}

export function CertificateRequestsTable({
  requests,
  isLoading,
  onApprove,
  onReject,
  onDeleteRequest,
  isDeleting,
  showBatchInfo = true
}: CertificateRequestsTableProps) {
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    requestId: string | null;
  }>({ open: false, requestId: null });
  const [rejectionReason, setRejectionReason] = useState('');
  const [detailsDialog, setDetailsDialog] = useState<{
    open: boolean;
    request: any | null;
  }>({ open: false, request: null });

  const handleReject = async () => {
    if (!rejectDialog.requestId || !rejectionReason.trim()) return;

    try {
      await onReject(rejectDialog.requestId, rejectionReason.trim());
      setRejectDialog({ open: false, requestId: null });
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssessmentBadge = (assessmentStatus: string) => {
    if (!assessmentStatus) {
      return <Badge variant="outline" className="bg-gray-50 text-gray-500">Not Set</Badge>;
    }
    
    switch (assessmentStatus.toUpperCase()) {
      case 'PASS':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 font-semibold">✓ PASS</Badge>;
      case 'FAIL':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 font-semibold">✗ FAIL</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-600">{assessmentStatus}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Loading certificate requests...</div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No certificate requests found.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">Recipient</TableHead>
              <TableHead className="font-semibold">Assessment</TableHead>
              <TableHead className="font-semibold">Course Details</TableHead>
              <TableHead className="font-semibold">Location</TableHead>
              <TableHead className="font-semibold">Instructor</TableHead>
              <TableHead className="font-semibold">Certification Levels</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              {showBatchInfo && <TableHead className="font-semibold">Batch</TableHead>}
              <TableHead className="font-semibold">Submitted</TableHead>
              <TableHead className="font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id} className="hover:bg-gray-50">
                {/* Recipient */}
                <TableCell className="min-w-[200px]">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{request.recipient_name}</div>
                    <div className="text-sm text-gray-600">{request.email || request.recipient_email}</div>
                    {request.company && (
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.company}
                      </div>
                    )}
                    {request.phone && (
                      <div className="text-xs text-gray-500">{request.phone}</div>
                    )}
                  </div>
                </TableCell>

                {/* Assessment Status */}
                <TableCell className="min-w-[100px]">
                  <div className="space-y-1">
                    {getAssessmentBadge(request.assessment_status)}
                    {request.assessment_status === 'FAIL' && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        Cannot approve
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Course Details */}
                <TableCell className="min-w-[180px]">
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">{request.course_name}</div>
                    {request.length && (
                      <div className="text-xs text-gray-500">{request.length} hours</div>
                    )}
                    {request.issue_date && (
                      <div className="text-xs text-gray-500">
                        Issue: {request.issue_date}
                      </div>
                    )}
                    {request.expiry_date && (
                      <div className="text-xs text-gray-500">
                        Expires: {request.expiry_date}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell className="min-w-[140px]">
                  <div className="space-y-1">
                    {request.location_id ? (
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-700">Location ID: {request.location_id.slice(-8)}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        No location
                      </div>
                    )}
                    {(request.city || request.province) && (
                      <div className="text-xs text-gray-500">
                        {[request.city, request.province].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Instructor */}
                <TableCell className="min-w-[140px]">
                  <div className="space-y-1">
                    {request.instructor_name ? (
                      <>
                        <div className="text-sm font-medium text-gray-900">
                          {request.instructor_name}
                        </div>
                        {request.instructor_level && (
                          <div className="text-xs text-gray-500">
                            Level: {request.instructor_level}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <AlertTriangle className="h-3 w-3" />
                        No instructor
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Certification Levels */}
                <TableCell className="min-w-[140px]">
                  <div className="space-y-1">
                    {request.first_aid_level && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        <Award className="h-3 w-3 mr-1" />
                        First Aid: {request.first_aid_level}
                      </Badge>
                    )}
                    {request.cpr_level && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        <Award className="h-3 w-3 mr-1" />
                        CPR: {request.cpr_level}
                      </Badge>
                    )}
                    {!request.first_aid_level && !request.cpr_level && (
                      <div className="text-xs text-gray-400">No levels specified</div>
                    )}
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  {getStatusBadge(request.status)}
                </TableCell>

                {/* Batch Info */}
                {showBatchInfo && (
                  <TableCell className="min-w-[120px]">
                    {request.batch_name ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Package className="h-3 w-3 text-green-600" />
                        <span className="text-green-700 font-medium">{request.batch_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Individual</span>
                    )}
                  </TableCell>
                )}

                {/* Submitted Date */}
                <TableCell className="min-w-[100px]">
                  <div className="text-sm">
                    {format(new Date(request.created_at), 'MMM dd, yyyy')}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(request.created_at), 'HH:mm')}
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailsDialog({ open: true, request })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {request.status === 'PENDING' && (
                      <>
                        {request.assessment_status !== 'FAIL' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onApprove(request.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRejectDialog({ open: true, requestId: request.id })}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRequest(request.id)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => {
        setRejectDialog({ open, requestId: null });
        setRejectionReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Certificate Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this certificate request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog({ open: false, requestId: null });
                setRejectionReason('');
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => {
        setDetailsDialog({ open, request: null });
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Certificate Request Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.request && (
            <div className="space-y-6">
              {/* Assessment Status Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg">{detailsDialog.request.recipient_name}</h3>
                  <p className="text-sm text-gray-600">{detailsDialog.request.email || detailsDialog.request.recipient_email}</p>
                </div>
                <div className="flex gap-2">
                  {getAssessmentBadge(detailsDialog.request.assessment_status)}
                  {getStatusBadge(detailsDialog.request.status)}
                </div>
              </div>

              {/* Main Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-1">Personal Information</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <div className="font-medium">{detailsDialog.request.email || detailsDialog.request.recipient_email || 'N/A'}</div>
                    </div>
                    
                    {detailsDialog.request.phone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <div className="font-medium">{detailsDialog.request.phone}</div>
                      </div>
                    )}
                    
                    {detailsDialog.request.company && (
                      <div>
                        <span className="text-gray-500">Company:</span>
                        <div className="font-medium">{detailsDialog.request.company}</div>
                      </div>
                    )}
                    
                    {(detailsDialog.request.city || detailsDialog.request.province) && (
                      <div>
                        <span className="text-gray-500">Location:</span>
                        <div className="font-medium">
                          {[detailsDialog.request.city, detailsDialog.request.province, detailsDialog.request.postal_code].filter(Boolean).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Course Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-1">Course Information</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Course:</span>
                      <div className="font-medium">{detailsDialog.request.course_name}</div>
                    </div>
                    
                    {detailsDialog.request.length && (
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{detailsDialog.request.length} hours</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Issue Date:</span>
                      <div className="font-medium">{detailsDialog.request.issue_date}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Expiry Date:</span>
                      <div className="font-medium">{detailsDialog.request.expiry_date}</div>
                    </div>
                    
                    {detailsDialog.request.instructor_name && (
                      <div>
                        <span className="text-gray-500">Instructor:</span>
                        <div className="font-medium">{detailsDialog.request.instructor_name}</div>
                        {detailsDialog.request.instructor_level && (
                          <div className="text-xs text-gray-500">Level: {detailsDialog.request.instructor_level}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Certification & Status */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 border-b pb-1">Certification Details</h4>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Assessment Status:</span>
                      <div className="mt-1">{getAssessmentBadge(detailsDialog.request.assessment_status)}</div>
                    </div>
                    
                    {detailsDialog.request.first_aid_level && (
                      <div>
                        <span className="text-gray-500">First Aid Level:</span>
                        <div className="font-medium">{detailsDialog.request.first_aid_level}</div>
                      </div>
                    )}
                    
                    {detailsDialog.request.cpr_level && (
                      <div>
                        <span className="text-gray-500">CPR Level:</span>
                        <div className="font-medium">{detailsDialog.request.cpr_level}</div>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-500">Request Status:</span>
                      <div className="mt-1">{getStatusBadge(detailsDialog.request.status)}</div>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Submitted:</span>
                      <div className="font-medium">{format(new Date(detailsDialog.request.created_at), 'PPP p')}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Batch Information */}
              {detailsDialog.request.batch_name && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Batch Information</h4>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-700">{detailsDialog.request.batch_name}</span>
                  </div>
                </div>
              )}
              
              {/* Rejection Reason */}
              {detailsDialog.request.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Rejection Reason</h4>
                  <p className="text-red-700">{detailsDialog.request.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailsDialog({ open: false, request: null })}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
