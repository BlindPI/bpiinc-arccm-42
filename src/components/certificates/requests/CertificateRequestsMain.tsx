
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

// Import components
import { RequestFilters } from '@/components/certificates/RequestFilters';
import { BatchViewContent } from '@/components/certificates/BatchViewContent';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { useRequestsState } from './hooks/useRequestsState';
import { useRequestFiltering } from './hooks/useRequestFiltering';

export function CertificateRequestsMain() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  
  // Ensure consistent role check across components
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    viewMode,
    setViewMode,
    isRefreshing,
    handleRefresh,
    selectedRequestId,
    setSelectedRequestId,
    rejectionReason,
    setRejectionReason,
    handleUpdateRequest
  } = useRequestsState(profile);

  const {
    requests,
    isLoading,
    filteredRequests,
    groupedBatches,
    handleApprove,
    handleReject,
    handleDeleteRequest,
    deleteRequestMutation
  } = useRequestFiltering({
    statusFilter,
    searchQuery,
    profile
  });

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isAdmin ? 'Certificate Requests' : 'Your Certificate Requests'}
          </CardTitle>
          
          <RequestFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {viewMode === 'batch' && (
          <BatchViewContent 
            groupedBatches={groupedBatches}
            isPending={false}
            onUpdateRequest={handleUpdateRequest}
            selectedRequestId={selectedRequestId}
            setSelectedRequestId={setSelectedRequestId}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
          />
        )}
        
        {viewMode === 'list' && (
          <CertificateRequestsTable
            requests={filteredRequests}
            isLoading={isLoading || profileLoading}
            onApprove={handleApprove}
            onReject={handleReject}
            onDeleteRequest={handleDeleteRequest}
            isDeleting={deleteRequestMutation.isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}
