
import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

// Components for refactored parts
import { RequestFilters } from '@/components/certificates/RequestFilters';
import { BatchViewContent } from '@/components/certificates/BatchViewContent';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';
import { useCertificateRequests } from '@/hooks/useCertificateRequests';

export function CertificateRequestsContainer() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('PENDING');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'list' | 'batch'>('batch');
  
  // Ensure consistent role check across components
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Debug admin status
  React.useEffect(() => {
    console.log('Admin status in CertificateRequestsContainer:', isAdmin);
    console.log('Profile data:', profile);
  }, [isAdmin, profile]);
  
  const updateRequestMutation = useCertificateRequest();
  
  // Use the custom hook for fetching requests
  const { requests, isLoading, error: queryError } = useCertificateRequests({
    isAdmin,
    statusFilter,
    profileId: profile?.id
  });

  // Log any query errors and fetched requests count
  React.useEffect(() => {
    if (queryError) {
      console.error('Certificate requests query error:', queryError);
      toast.error(`Error loading requests: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
    
    console.log(`Found ${requests?.length || 0} certificate requests with status filter: ${statusFilter}`);
  }, [queryError, requests, statusFilter]);

  const { 
    handleApprove, 
    handleReject, 
    handleDeleteRequest, 
    deleteRequestMutation
  } = useCertificateRequestsActions(profile);

  // Manual refresh function
  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['certificateRequests'] })
      .then(() => {
        toast.success('Certificate requests refreshed');
        setIsRefreshing(false);
      })
      .catch(error => {
        console.error('Error refreshing requests:', error);
        toast.error('Failed to refresh requests');
        setIsRefreshing(false);
      });
  };
  
  const filteredRequests = React.useMemo(() => {
    if (!requests) return [];
    
    console.log(`Filtering ${requests.length} requests with search query: "${searchQuery}"`);
    
    return requests.filter(request => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.recipient_name?.toLowerCase().includes(searchLower) ||
          request.course_name?.toLowerCase().includes(searchLower) ||
          (request.email && request.email.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [requests, searchQuery]);

  // Use our custom hook to get grouped batches
  const groupedBatches = useCertificateBatches(filteredRequests);
  
  // Debug grouped batches
  React.useEffect(() => {
    console.log(`Grouped ${filteredRequests.length} requests into ${groupedBatches.length} batches`);
    console.log('Current user role:', profile?.role);
    console.log('Is admin:', isAdmin);
  }, [filteredRequests.length, groupedBatches.length, profile?.role, isAdmin]);

  // Handle update request function
  const handleUpdateRequest = async (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED'; 
    rejectionReason?: string 
  }): Promise<void> => {
    if (params.status === 'APPROVED') {
      return handleApprove(params.id);
    } else if (params.status === 'REJECTED') {
      return handleReject(params.id, params.rejectionReason || '');
    } else {
      await updateRequestMutation.mutateAsync({
        ...params,
        profile
      });
      // Return void to fix TypeScript error
      return;
    }
  };

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
            isPending={updateRequestMutation.isPending}
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
