
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Eye, Layers } from 'lucide-react';
import { RequestFilters } from '@/components/certificates/RequestFilters';
import { BatchViewContent } from '@/components/certificates/BatchViewContent';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { EnterprisePendingRequestsView } from '@/components/certificates/enhanced-views/EnterprisePendingRequestsView';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';
import { useCertificateRequests } from '@/hooks/useCertificateRequests';
import { useProfile } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

type ViewMode = 'enterprise' | 'batch' | 'list';

export function CertificateRequestsContainer() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('PENDING');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('enterprise');
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');
  
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  // Only use the legacy hooks for non-pending requests or non-enterprise view
  const { requests, isLoading, error: queryError } = useCertificateRequests({
    isAdmin,
    statusFilter,
    profileId: profile?.id
  });

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

  const groupedBatches = useCertificateBatches(filteredRequests);
  
  const handleUpdateRequest = async (params: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED'; 
    rejectionReason?: string 
  }): Promise<void> => {
    if (params.status === 'APPROVED') {
      return handleApprove(params.id);
    } else if (params.status === 'REJECTED') {
      return handleReject(params.id, params.rejectionReason || '');
    }
    // Handle other statuses if needed
  };

  // Handle view mode change with proper typing
  const handleViewModeChange = (mode: string) => {
    if (mode === 'enterprise' || mode === 'batch' || mode === 'list') {
      setViewMode(mode as ViewMode);
    }
  };

  // Show enterprise view for pending requests
  if (statusFilter === 'PENDING' && viewMode === 'enterprise') {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              {isAdmin ? 'Certificate Requests' : 'Your Certificate Requests'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Enterprise View
              </Badge>
              
              <RequestFilters 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                viewMode={viewMode}
                setViewMode={handleViewModeChange}
                handleRefresh={handleRefresh}
                isRefreshing={isRefreshing}
                showEnterpriseToggle={true}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <EnterprisePendingRequestsView />
        </CardContent>
      </Card>
    );
  }

  // Legacy views for other statuses or view modes
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
            setViewMode={handleViewModeChange}
            handleRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            showEnterpriseToggle={statusFilter === 'PENDING'}
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
