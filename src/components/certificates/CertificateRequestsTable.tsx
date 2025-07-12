
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, XCircle, Trash2, AlertCircle, Eye, FileText, ChevronDown, ChevronRight, MapPin, User, Phone, Building, StickyNote } from 'lucide-react';
import { CertificateRequest } from '@/types/supabase-schema';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';

interface CertificateRequestsTableProps {
  requests: CertificateRequest[];
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
  const { data: profile } = useProfile();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Only SA/AD users can manage requests
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  const toggleRowExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRows(newExpanded);
  };

  const handleRejectClick = (requestId: string) => {
    if (!canManageRequests) return;
    setSelectedRequestId(requestId);
    setIsRejectionDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!canManageRequests || !selectedRequestId) return;
    
    try {
      await onReject(selectedRequestId, rejectionReason);
      setIsRejectionDialogOpen(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    } catch (error) {
      console.error('Error confirming rejection:', error);
    }
  };

  const handleApproveClick = async (requestId: string) => {
    if (!canManageRequests) return;
    
    try {
      await onApprove(requestId);
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const getStatusBadge = (status: string, assessmentStatus?: string) => {
    if (assessmentStatus === 'FAIL') {
      return <Badge variant="destructive">Failed Assessment</Badge>;
    }
    
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline">Pending</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading requests...</p>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No certificate requests found</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Status</TableHead>
              {showBatchInfo && <TableHead>Batch</TableHead>}
              <TableHead>Notes</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const isExpanded = expandedRows.has(request.id);
              const extendedRequest = request as CertificateRequest & { notes?: string | null };
              const hasAdditionalData = request.phone || request.company ||
                                      request.city || request.province || request.postal_code ||
                                      request.instructor_name || request.instructor_level;
              
              return (
                <React.Fragment key={request.id}>
                  <TableRow>
                    <TableCell>
                      {hasAdditionalData && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(request.id)}
                          className="h-6 w-6 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.recipient_name}</div>
                        {request.email && (
                          <div className="text-sm text-muted-foreground">{request.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{request.course_name}</TableCell>
                    <TableCell>{request.issue_date}</TableCell>
                    <TableCell>
                      {request.assessment_status === 'FAIL' ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          Failed
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          Passed
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(request.status, request.assessment_status)}
                    </TableCell>
                    {showBatchInfo && (
                      <TableCell>
                        {request.batch_name || 'Individual'}
                      </TableCell>
                    )}
                    <TableCell>
                      {extendedRequest.notes ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-sm px-2 py-1 text-xs text-amber-800 max-w-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <StickyNote className="h-3 w-3" />
                            <span className="font-medium">Notes:</span>
                          </div>
                          <div className="truncate" title={extendedRequest.notes}>
                            {extendedRequest.notes}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Only show management buttons for SA/AD users */}
                        {canManageRequests ? (
                          <>
                            {request.assessment_status === 'FAIL' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onDeleteRequest(request.id)}
                                disabled={isDeleting}
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : request.status === 'PENDING' ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRejectClick(request.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApproveClick(request.id)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </>
                            ) : null}
                          </>
                        ) : (
                          <div className="text-xs text-gray-500 px-2">
                            View only
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  
                  {/* Expanded details row */}
                  {isExpanded && hasAdditionalData && (
                    <TableRow>
                      <TableCell colSpan={showBatchInfo ? 10 : 9} className="bg-muted/50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Contact Information */}
                          {(request.phone || request.company) && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Contact Information
                              </h4>
                              {request.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span>{request.phone}</span>
                                </div>
                              )}
                              {request.company && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Building className="h-3 w-3 text-gray-400" />
                                  <span>{request.company}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Address Information */}
                          {(request.city || request.province || request.postal_code) && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Address
                              </h4>
                              <div className="text-sm text-gray-600">
                                {[request.city, request.province, request.postal_code]
                                  .filter(Boolean)
                                  .join(', ')}
                              </div>
                            </div>
                          )}
                          
                          {/* Instructor Information */}
                          {(request.instructor_name || request.instructor_level) && (
                            <div className="space-y-2">
                              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-1">
                                <User className="h-4 w-4" />
                                Instructor
                              </h4>
                              {request.instructor_name && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Name:</span> {request.instructor_name}
                                </div>
                              )}
                              {request.instructor_level && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium">Level:</span> {request.instructor_level}
                                </div>
                              )}
                            </div>
                          )}
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Only show rejection dialog for SA/AD users */}
      {canManageRequests && (
        <Dialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Certificate Request</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-3 text-sm">
                Please provide a reason for rejecting this certificate request.
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
                disabled={!rejectionReason || isDeleting}
              >
                {isDeleting ? 'Rejecting...' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
