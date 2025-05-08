
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { BatchViewContent } from '@/components/certificates/BatchViewContent';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';

const CertificateRequests = () => {
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
  
  const { data: requests = [], isLoading, error: queryError } = useQuery({
    queryKey: ['certificateRequests', isAdmin, statusFilter, profile?.id],
    queryFn: async () => {
      console.log('Fetching certificate requests with params:', { 
        isAdmin, 
        statusFilter, 
        userId: profile?.id 
      });
      
      try {
        let query = supabase
          .from('certificate_requests')
          .select('*');
        
        // Only filter by user_id if not an admin
        if (!isAdmin && profile?.id) {
          console.log('Filtering requests by user_id:', profile.id);
          query = query.eq('user_id', profile.id);
        } else {
          console.log('User is admin, fetching all requests');
        }
        
        if (statusFilter !== 'all') {
          console.log('Filtering by status:', statusFilter);
          query = query.eq('status', statusFilter);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching certificate requests:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} certificate requests`);
        return data as CertificateRequest[];
      } catch (error) {
        console.error('Error in certificate requests query:', error);
        toast.error(`Failed to fetch certificate requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!profile,
  });

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
      await queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
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
  
  // DEBUG: Log requests after filtering to help diagnose visibility issues
  React.useEffect(() => {
    console.log(`Filtered requests count: ${filteredRequests.length}`);
    console.log(`Grouped into ${groupedBatches.length} batches`);
    console.log('Current user role:', profile?.role);
    console.log('Is admin:', isAdmin);
  }, [filteredRequests, groupedBatches.length, profile?.role, isAdmin]);

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
};

export default CertificateRequests;
