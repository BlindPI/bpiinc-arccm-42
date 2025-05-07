
import React from 'react';
import { Layers } from 'lucide-react';
import { BatchRequestGroup } from '@/components/certificates/BatchRequestGroup';
import { EmptyRequestsMessage } from '@/components/certificates/EmptyRequestsMessage';

interface BatchViewContentProps {
  groupedBatches: Array<{
    batchId: string;
    submittedAt: string;
    submittedBy: string;
    requests: any[];
  }>;
  isPending: boolean;
  onUpdateRequest: (params: any) => void;
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 text-muted-foreground">
        <Layers className="h-4 w-4" />
        <span>{groupedBatches.length} batch{groupedBatches.length !== 1 ? 'es' : ''} found</span>
      </div>
      
      {groupedBatches.map(batch => (
        <BatchRequestGroup
          key={batch.batchId}
          batchId={batch.batchId}
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
  );
}
