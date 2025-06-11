
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Users, Calendar, User, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { CertificateRequestsTable } from './CertificateRequestsTable';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BatchRequestGroupProps {
  batchId: string;
  batchName: string;
  requests: any[];
  submittedBy: string;
  submittedAt: string;
  isPending: boolean;
  onUpdateRequest: (params: any) => Promise<void>;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export function BatchRequestGroup({
  batchId,
  batchName,
  requests,
  submittedBy,
  submittedAt,
  isPending,
  onUpdateRequest,
  selectedRequestId,
  setSelectedRequestId,
  rejectionReason,
  setRejectionReason
}: BatchRequestGroupProps) {
  const { data: profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const isIndividualRequest = batchId.startsWith('individual_');
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;
  const failedCount = requests.filter(r => r.assessment_status === 'FAIL').length;
  const passedCount = requests.filter(r => r.assessment_status !== 'FAIL').length;

  // Only SA/AD users can manage requests
  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  const handleBatchApprove = async () => {
    if (!canManageRequests) return;
    
    const pendingRequests = requests.filter(r => r.status === 'PENDING' && r.assessment_status !== 'FAIL');
    for (const request of pendingRequests) {
      try {
        await onUpdateRequest({
          id: request.id,
          status: 'APPROVED'
        });
      } catch (error) {
        console.error('Failed to approve request:', error);
        break; // Stop on first error
      }
    }
  };

  const handleBatchReject = async () => {
    if (!canManageRequests || !rejectionReason.trim()) return;
    
    const pendingRequests = requests.filter(r => r.status === 'PENDING');
    for (const request of pendingRequests) {
      try {
        await onUpdateRequest({
          id: request.id,
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim()
        });
      } catch (error) {
        console.error('Failed to reject request:', error);
        break; // Stop on first error
      }
    }
  };

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  )}
                  {isIndividualRequest ? (
                    <User className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Package className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">
                    {batchName}
                  </CardTitle>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(submittedAt), 'PPP p')}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {requests.length} request{requests.length !== 1 ? 's' : ''}
                    </div>
                    {/* Assessment Summary */}
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">{passedCount} Pass</span>
                      {failedCount > 0 && (
                        <span className="text-red-600">{failedCount} Fail</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Status badges */}
                {pendingCount > 0 && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    {pendingCount} Pending
                  </Badge>
                )}
                {approvedCount > 0 && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {approvedCount} Approved
                  </Badge>
                )}
                {rejectedCount > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {rejectedCount} Rejected
                  </Badge>
                )}
                {failedCount > 0 && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    {failedCount} Failed Assessment
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="mb-4">
              {/* Batch actions for pending requests - only for SA/AD users */}
              {canManageRequests && pendingCount > 0 && !isIndividualRequest && (
                <div className="flex gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchApprove}
                    disabled={isPending || passedCount === 0}
                    className="text-green-700 border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve All Passed ({passedCount})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBatchReject}
                    disabled={isPending || !rejectionReason.trim()}
                    className="text-red-700 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject All Pending
                  </Button>
                </div>
              )}

              {/* Show info for non-admin users */}
              {!canManageRequests && pendingCount > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
                  <strong>Note:</strong> Administrative approval required for pending requests.
                </div>
              )}
            </div>
            
            <CertificateRequestsTable
              requests={requests}
              isLoading={false}
              onApprove={async (id) => {
                await onUpdateRequest({ id, status: 'APPROVED' });
              }}
              onReject={async (id, reason) => {
                await onUpdateRequest({ id, status: 'REJECTED', rejectionReason: reason });
              }}
              onDeleteRequest={async (id) => {
                await onUpdateRequest({ id, status: 'ARCHIVED' });
              }}
              isDeleting={isPending}
              showBatchInfo={false}
            />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
