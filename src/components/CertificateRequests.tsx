
import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { CertificateRequest } from '@/types/supabase-schema';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

// Components for refactored parts
import { RequestFilters } from '@/components/certificates/RequestFilters';
import { EmptyRequestsMessage } from '@/components/certificates/EmptyRequestsMessage';
import { BatchViewContent } from '@/components/certificates/BatchViewContent';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';
import { useCertificateRequests } from '@/hooks/useCertificateRequests';

export function CertificateRequests() {
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
  
  const updateRequestMutation = useCertificateRequest();

  const { 
    requests = [], 
    isLoading, 
    error: queryError, 
    refreshRequests 
  } = useCertificateRequests({
    isAdmin, 
    statusFilter, 
    profileId: profile?.id
  });
  
  // Set up realtime subscription for certificate requests
  useEffect(() => {
    if (!profile?.id) return;
    
    // Create a channel for realtime updates
    const channel = supabase
      .channel('certificate-requests-changes')
      .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'certificate_requests' 
          }, 
          (payload) => {
            console.log('Certificate request change detected:', payload);
            
            // Refresh data when a change is detected
            queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
            
            // Show a toast notification based on the event type and status
            if (payload.eventType === 'UPDATE') {
              const newStatus = payload.new.status;
              const statusMessages = {
                'APPROVED': 'A certificate request was approved',
                'REJECTED': 'A certificate request was rejected',
                'ARCHIVED': 'A certificate request was archived',
                'PENDING': 'A certificate request status was updated'
              };
              
              toast.info(statusMessages[newStatus as keyof typeof statusMessages] || 'A certificate request was updated');
            } else if (payload.eventType === 'INSERT') {
              toast.info('New certificate request received');
            } else if (payload.eventType === 'DELETE') {
              toast.info('A certificate request was deleted');
            }
          })
      .subscribe();
      
    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, queryClient]);

  // Log any query errors
  React.useEffect(() => {
    if (queryError) {
      console.error('Certificate requests query error:', queryError);
      toast.error(`Error loading requests: ${queryError instanceof Error ? queryError.message : 'Unknown error'}`);
    }
  }, [queryError]);

  const { 
    handleApprove, 
    handleReject, 
    handleDeleteRequest, 
    deleteRequestMutation
  } = useCertificateRequestsActions(profile);

  // Manual refresh function
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRequests();
      toast.success('Certificate requests refreshed');
    } catch (error) {
      console.error('Error refreshing requests:', error);
      toast.error('Failed to refresh requests');
    } finally {
      setIsRefreshing(false);
    }
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

  // Use our custom hook to get grouped batches
  const groupedBatches = useCertificateBatches(filteredRequests);

  // Function to handle update requests, ensuring proper profile passing
  const handleUpdateRequest = async (params: {
    id: string;
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED';
    rejectionReason?: string;
  }) => {
    console.log('Handling update request:', params);
    
    if (params.status === 'APPROVED') {
      await handleApprove(params.id);
    } else if (params.status === 'REJECTED') {
      await handleReject(params.id, params.rejectionReason || '');
    } else {
      await updateRequestMutation.mutateAsync({
        ...params,
        profile
      });
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
