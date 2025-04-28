import React from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { CertificateRequest } from '@/types/supabase-schema';
import { Filter, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function CertificateRequests() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('PENDING');
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const updateRequestMutation = useCertificateRequest();
  
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['certificateRequests', isAdmin, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('certificate_requests')
        .select('*');
      
      if (!isAdmin && profile?.id) {
        query = query.eq('user_id', profile.id);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CertificateRequest[];
    },
    enabled: !!profile,
  });

  const deleteRequestMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('certificate_requests')
        .delete()
        .eq('id', requestId);
      
      if (error) throw error;
      return requestId;
    },
    onMutate: (requestId) => {
      queryClient.setQueryData(['certificateRequests', isAdmin, statusFilter], (oldData: any[]) => {
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
    deleteRequestMutation.mutate(requestId);
  };
  
  const handleApprove = (requestId: string) => {
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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 overflow-hidden">
        <CertificateRequestsTable
          requests={filteredRequests}
          isLoading={isLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onDeleteRequest={handleDeleteRequest}
          isDeleting={deleteRequestMutation.isPending}
        />
      </CardContent>
    </Card>
  );
}
