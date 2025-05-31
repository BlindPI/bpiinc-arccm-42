
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
import { CheckCircle, XCircle, Trash2, Eye, Package } from "lucide-react";
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
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            {showBatchInfo && <TableHead>Batch</TableHead>}
            <TableHead>Submitted</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{request.recipient_name}</div>
                  <div className="text-sm text-muted-foreground">{request.email || request.recipient_email}</div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{request.course_name}</div>
                  {request.instructor_name && (
                    <div className="text-sm text-muted-foreground">Instructor: {request.instructor_name}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{request.company || 'N/A'}</TableCell>
              <TableCell>{getStatusBadge(request.status)}</TableCell>
              {showBatchInfo && (
                <TableCell>
                  {request.batch_name ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Package className="h-3 w-3" />
                      <span className="text-green-700">{request.batch_name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Individual</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <div className="text-sm">
                  {format(new Date(request.created_at), 'PPP')}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailsDialog({ open: true, request })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {request.status === 'PENDING' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onApprove(request.id)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
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

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => {
        setDetailsDialog({ open, request: null });
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Certificate Request Details</DialogTitle>
          </DialogHeader>
          {detailsDialog.request && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Recipient Name</Label>
                  <div className="font-medium">{detailsDialog.request.recipient_name}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div>{detailsDialog.request.email || detailsDialog.request.recipient_email || 'N/A'}</div>
                </div>
                <div>
                  <Label>Course</Label>
                  <div className="font-medium">{detailsDialog.request.course_name}</div>
                </div>
                <div>
                  <Label>Company</Label>
                  <div>{detailsDialog.request.company || 'N/A'}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(detailsDialog.request.status)}</div>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <div>{format(new Date(detailsDialog.request.created_at), 'PPP p')}</div>
                </div>
              </div>
              
              {detailsDialog.request.batch_name && (
                <div>
                  <Label>Batch Information</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="font-medium">{detailsDialog.request.batch_name}</span>
                  </div>
                </div>
              )}
              
              {detailsDialog.request.rejection_reason && (
                <div>
                  <Label>Rejection Reason</Label>
                  <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                    {detailsDialog.request.rejection_reason}
                  </div>
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
