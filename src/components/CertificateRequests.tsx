import React from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { CertificateRequest } from '@/types/supabase-schema';
import { Filter, ClipboardList, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CertificateRequests() {
  const { data: profile, isLoading: profileLoading } = useProfile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('PENDING');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  
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

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      // Double-check permissions
      if (profile?.role !== 'SA') {
        throw new Error('Only System Administrators can delete certificate requests');
      }
      
      console.log('Deleting certificate request:', requestId);
      const { error } = await supabase
        .from('certificate_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      return requestId;
    },
    onMutate: (requestId) => {
      queryClient.setQueryData(['certificateRequests', isAdmin, statusFilter, profile?.id], (oldData: any[]) => {
        return oldData.filter(req => req.id !== requestId);
      });
    },
    onSuccess: (requestId) => {
      toast.success('Certificate request deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
    onError: (error) => {
      console.error('Error deleting certificate request:', error);
      toast.error(`Failed to delete request: ${error instanceof Error ? error.message : 'Unknown error'}`);
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
    },
  });

  const handleDeleteRequest = (requestId: string) => {
    if (profile?.role !== 'SA') {
      toast.error('Only System Administrators can delete certificate requests');
      return;
    }
    
    deleteRequestMutation.mutate(requestId);
  };
  
  const handleApprove = (requestId: string) => {
    // Double-check permissions
    if (!isAdmin) {
      toast.error('Only Administrators can approve certificate requests');
      return;
    }
    
    updateRequestMutation.mutate({
      id: requestId,
      status: 'APPROVED',
      profile,
    });
  };
  
  const handleReject = (requestId: string, rejectionReason: string) => {
    // Double-check permissions
    if (!isAdmin) {
      toast.error('Only Administrators can reject certificate requests');
      return;
    }
    
    updateRequestMutation.mutate({
      id: requestId,
      status: 'REJECTED',
      rejectionReason,
      profile,
    });
  };

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
          request.recipient_name.toLowerCase().includes(searchLower) ||
          request.course_name.toLowerCase().includes(searchLower) ||
          (request.email && request.email.toLowerCase().includes(searchLower))
        );
      }
      
      return true;
    });
  }, [requests, searchQuery]);

  // DEBUG: Log requests after filtering to help diagnose visibility issues
  React.useEffect(() => {
    console.log(`Filtered requests count: ${filteredRequests.length}`);
    console.log('Current user role:', profile?.role);
    console.log('Is admin:', isAdmin);
  }, [filteredRequests, profile?.role, isAdmin]);
  
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
      </CardHeader>
      
      <CardContent className="p-0 overflow-hidden">
        <CertificateRequestsTable
          requests={filteredRequests}
          isLoading={isLoading || profileLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onDeleteRequest={handleDeleteRequest}
          isDeleting={deleteRequestMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}