
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';
import { CertificateRequestsTable } from '@/components/certificates/CertificateRequestsTable';
import { CertificateRequest } from '@/types/supabase-schema';
import { Filter, ClipboardList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CertificateRequests() {
  const { data: profile } = useProfile();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
  
  const updateRequestMutation = useCertificateRequest();
  
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['certificateRequests', isAdmin],
    queryFn: async () => {
      // If admin, get all requests, otherwise get only user's requests
      let query = supabase
        .from('certificate_requests')
        .select('*');
      
      if (!isAdmin && profile?.id) {
        query = query.eq('user_id', profile.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CertificateRequest[];
    },
    enabled: !!profile,
  });
  
  const handleApprove = (requestId: string) => {
    updateRequestMutation.mutate({
      id: requestId,
      status: 'APPROVED',
      profile,
    });
  };
  
  const handleReject = (requestId: string, rejectionReason: string) => {
    updateRequestMutation.mutate({
      id: requestId,
      status: 'REJECTED',
      rejectionReason,
      profile,
    });
  };
  
  // Filter and search requests
  const filteredRequests = React.useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      // Status filter
      if (statusFilter !== 'all' && request.status !== statusFilter) {
        return false;
      }
      
      // Search filter
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
  }, [requests, searchQuery, statusFilter]);
  
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
        />
      </CardContent>
    </Card>
  );
}
