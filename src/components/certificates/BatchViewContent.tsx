
import React from 'react';
import { Layers, Package, User } from 'lucide-react';
import { BatchRequestGroup } from '@/components/certificates/BatchRequestGroup';
import { EmptyRequestsMessage } from '@/components/certificates/EmptyRequestsMessage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface BatchViewContentProps {
  groupedBatches: Array<{
    batchId: string;
    batchName: string;
    submittedAt: string;
    submittedBy: string;
    requests: any[];
  }>;
  isPending: boolean;
  onUpdateRequest: (params: any) => Promise<void>;
  selectedRequestId: string | null;
  setSelectedRequestId: (id: string | null) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
}

export function BatchViewContent({
  groupedBatches,
  isPending,
  onUpdateRequest,
  selectedRequestId,
  setSelectedRequestId,
  rejectionReason,
  setRejectionReason
}: BatchViewContentProps) {
  if (groupedBatches.length === 0) {
    return <EmptyRequestsMessage />;
  }

  const batchSubmissions = groupedBatches.filter(batch => !batch.batchId.startsWith('individual_'));
  const individualSubmissions = groupedBatches.filter(batch => batch.batchId.startsWith('individual_'));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <span>{groupedBatches.length} total group{groupedBatches.length !== 1 ? 's' : ''}</span>
        </div>
        {batchSubmissions.length > 0 && (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green-600" />
            <span>{batchSubmissions.length} batch submission{batchSubmissions.length !== 1 ? 's' : ''}</span>
          </div>
        )}
        {individualSubmissions.length > 0 && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <span>{individualSubmissions.length} individual request{individualSubmissions.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Global rejection reason for batch actions */}
      {batchSubmissions.length > 0 && (
        <div className="max-w-md">
          <Label htmlFor="batch-rejection-reason">Batch Rejection Reason (for "Reject All" actions)</Label>
          <Input
            id="batch-rejection-reason"
            placeholder="Enter reason for batch rejections..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="mt-1"
          />
        </div>
      )}
      
      {/* Batch Submissions First */}
      {batchSubmissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Batch Submissions
          </h3>
          {batchSubmissions.map(batch => (
            <BatchRequestGroup
              key={batch.batchId}
              batchId={batch.batchId}
              batchName={batch.batchName}
              requests={batch.requests}
              submittedBy={batch.submittedBy}
              submittedAt={batch.submittedAt}
              isPending={isPending}
              onUpdateRequest={onUpdateRequest}
              selectedRequestId={selectedRequestId}
              setSelectedRequestId={setSelectedRequestId}
              rejectionReason={rejectionReason}
              setRejectionReason={setRejectionReason}
            />
          ))}
        </div>
      )}

      {/* Individual Submissions */}
      {individualSubmissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Individual Requests
          </h3>
          {individualSubmissions.map(batch => (
            <BatchRequestGroup
              key={batch.batchId}
              batchId={batch.batchId}
              batchName={batch.batchName}
              requests={batch.requests}
              submittedBy={batch.submittedBy}
              submittedAt={batch.submittedAt}
              isPending={isPending}
              onUpdateRequest={onUpdateRequest}
              selectedRequestId={selectedRequestId}
              setSelectedRequestId={setSelectedRequestId}
              rejectionReason={rejectionReason}
              setRejectionReason={setRejectionReason}
            />
          ))}
        </div>
      )}
    </div>
  );
}
