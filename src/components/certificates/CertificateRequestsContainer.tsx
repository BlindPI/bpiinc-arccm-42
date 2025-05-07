
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { CertificateRequest } from '@/types/supabase-schema';
import { Filter, ClipboardList, RefreshCw, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { BatchRequestGroup } from '@/components/certificates/BatchRequestGroup';
import { useCertificateBatches } from '@/hooks/useCertificateBatches';
import { useCertificateRequestsActions } from '@/hooks/useCertificateRequestsActions';

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

  // Use our custom hook to get grouped batches
  const groupedBatches = useCertificateBatches(filteredRequests);
  
  // DEBUG: Log requests after filtering to help diagnose visibility issues
  React.useEffect(() => {
    console.log(`Filtered requests count: ${filteredRequests.length}`);
    console.log(`Grouped into ${groupedBatches.length} batches`);
    console.log('Current user role:', profile?.role);
    console.log('Is admin:', isAdmin);
  }, [filteredRequests, groupedBatches.length, profile?.role, isAdmin]);
  
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {isAdmin ? 'Certificate Requests' : 'Your Certificate Requests'}
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative">
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[200px] pl-8"
              />
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select
                value={viewMode}
                onValueChange={(value: 'list' | 'batch') => setViewMode(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="View mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="batch">Batch View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                title="Refresh requests"
                className="h-10 w-10 flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {viewMode === 'batch' && (
          <div className="space-y-4">
            {groupedBatches.length > 0 ? (
              <>
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
                    isPending={updateRequestMutation.isPending}
                    onUpdateRequest={(params) => {
                      if (params.status === 'APPROVED') {
                        handleApprove(params.id);
                      } else if (params.status === 'REJECTED') {
                        handleReject(params.id, params.rejectionReason || '');
                      } else {
                        updateRequestMutation.mutate({
                          ...params,
                          profile
                        });
                      }
                    }}
                    selectedRequestId={selectedRequestId}
                    setSelectedRequestId={setSelectedRequestId}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                  />
                ))}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No certificate requests found matching your criteria.</p>
              </div>
            )}
          </div>
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
