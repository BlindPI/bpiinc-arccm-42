
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  Download, 
  CheckCircle, 
  XCircle,
  Eye,
  Users,
  Layers,
  List
} from 'lucide-react';
import { DetailedRequestCard } from '../enhanced-requests/DetailedRequestCard';
import { BulkActionBar } from '../enhanced-requests/BulkActionBar';
import { RequestDetailsModal } from '../enhanced-requests/RequestDetailsModal';
import { BatchViewContent } from '../BatchViewContent';
import { EnhancedCertificateRequest } from '@/types/certificateValidation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CertificateRequest } from '@/types/supabase-schema';
import { useProfile } from '@/hooks/useProfile';

// Extended type to include submitter information
interface CertificateRequestWithSubmitter extends CertificateRequest {
  submitter?: {
    id: string;
    display_name: string;
    email: string;
  };
  submitter_name?: string;
}

// Helper function to transform database record to EnhancedCertificateRequest
const transformToEnhancedRequest = (dbRecord: CertificateRequestWithSubmitter): EnhancedCertificateRequest => {
  return {
    id: dbRecord.id,
    recipientName: dbRecord.recipient_name || '',
    email: dbRecord.email || dbRecord.recipient_email || '',
    phone: dbRecord.phone || '',
    company: dbRecord.company || '',
    courseName: dbRecord.course_name || '',
    courseId: dbRecord.course_id || '',
    locationId: dbRecord.location_id || '',
    locationName: '', // This would need to be fetched from locations table
    assessmentStatus: dbRecord.assessment_status as 'PASS' | 'FAIL',
    issueDate: dbRecord.issue_date || '',
    expiryDate: dbRecord.expiry_date || '',
    status: dbRecord.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    submittedBy: dbRecord.user_id || '',
    submittedAt: dbRecord.created_at || '',
    instructorName: dbRecord.instructor_name || '',
    firstAidLevel: dbRecord.first_aid_level || '',
    cprLevel: dbRecord.cpr_level || '',
    rejectionReason: dbRecord.rejection_reason || ''
  };
};

// Real batch grouping function that uses actual batch_id and batch_name
const groupRequestsByRealBatch = (requests: CertificateRequestWithSubmitter[]) => {
  if (!requests?.length) return [];
  
  const batches: Record<string, CertificateRequestWithSubmitter[]> = {};
  
  // Group by actual batch_id from database
  requests.forEach(request => {
    const batchKey = request.batch_id || 'no-batch';
    
    if (!batches[batchKey]) {
      batches[batchKey] = [];
    }
    
    batches[batchKey].push(request);
  });
  
  // Convert to array and sort by date (newest first)
  return Object.entries(batches)
    .map(([batchId, requests]) => {
      const firstRequest = requests[0];
      
      return {
        batchId: batchId,
        submittedAt: firstRequest.created_at || '',
        submittedBy: firstRequest.submitter_name || firstRequest.submitter?.display_name || 'Unknown',
        requests: requests.sort((a, b) => 
          a.recipient_name.localeCompare(b.recipient_name)
        )
      };
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
};

export function EnhancedPendingRequestsView() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<EnhancedCertificateRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [viewMode, setViewMode] = useState<'batch' | 'list'>('batch');
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Updated query to include submitter profile information with correct join syntax
  const { data: requests, isLoading } = useQuery({
    queryKey: ['enhanced-certificate-requests', statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('certificate_requests')
        .select(`
          *,
          profiles!certificate_requests_user_id_fkey(id, display_name, email)
        `)
        .eq('status', statusFilter);

      if (searchQuery) {
        query = query.or(`recipient_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,course_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform the data to include submitter name
      return (data || []).map(record => ({
        ...record,
        submitter: record.profiles,
        submitter_name: record.profiles?.display_name || 'Unknown'
      })) as CertificateRequestWithSubmitter[];
    }
  });

  const approveRequestsMutation = useMutation({
    mutationFn: async (requestIds: string[]) => {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ status: 'APPROVED' })
        .in('id', requestIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requests approved successfully');
      setSelectedRequests(new Set());
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
    }
  });

  const rejectRequestsMutation = useMutation({
    mutationFn: async ({ requestIds, reason }: { requestIds: string[], reason: string }) => {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ 
          status: 'REJECTED',
          rejection_reason: reason 
        })
        .in('id', requestIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Requests rejected');
      setSelectedRequests(new Set());
      queryClient.invalidateQueries({ queryKey: ['enhanced-certificate-requests'] });
    }
  });

  const handleSelectRequest = (requestId: string, selected: boolean) => {
    const newSelection = new Set(selectedRequests);
    if (selected) {
      newSelection.add(requestId);
    } else {
      newSelection.delete(requestId);
    }
    setSelectedRequests(newSelection);
  };

  const handleBulkApprove = () => {
    const requestIds = Array.from(selectedRequests);
    approveRequestsMutation.mutate(requestIds);
  };

  const handleBulkReject = (reason: string) => {
    const requestIds = Array.from(selectedRequests);
    rejectRequestsMutation.mutate({ requestIds, reason });
  };

  const handleApproveRequest = (requestId: string) => {
    approveRequestsMutation.mutate([requestId]);
  };

  const handleRejectRequest = (requestId: string, reason: string) => {
    rejectRequestsMutation.mutate({ requestIds: [requestId], reason });
  };

  const handleUpdateRequest = async (params: {
    id: string;
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED' | 'ARCHIVE_FAILED';
    rejectionReason?: string;
  }) => {
    if (params.status === 'APPROVED') {
      await approveRequestsMutation.mutateAsync([params.id]);
    } else if (params.status === 'REJECTED') {
      await rejectRequestsMutation.mutateAsync({ 
        requestIds: [params.id], 
        reason: params.rejectionReason || '' 
      });
    }
  };

  const filteredRequests = requests?.filter(request => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      request.recipient_name?.toLowerCase().includes(searchLower) ||
      request.email?.toLowerCase().includes(searchLower) ||
      request.course_name?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const passedRequests = filteredRequests.filter(req => req.assessment_status !== 'FAIL');

  // Use the real batch grouping function
  const groupedBatches = groupRequestsByRealBatch(filteredRequests);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced Certificate Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'batch' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('batch')}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                Batch View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                List View
              </Button>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              {['PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  size="sm"
                >
                  {status}
                </Button>
              ))}
            </div>
            
            {/* Actions */}
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredRequests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{passedRequests.length}</div>
            <div className="text-sm text-gray-600">Passed Assessment</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredRequests.length - passedRequests.length}
            </div>
            <div className="text-sm text-gray-600">Failed Assessment</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{selectedRequests.size}</div>
            <div className="text-sm text-gray-600">Selected</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedRequests.size > 0 && (
        <BulkActionBar
          selectedCount={selectedRequests.size}
          onApprove={handleBulkApprove}
          onReject={handleBulkReject}
          onClear={() => setSelectedRequests(new Set())}
        />
      )}

      {/* Requests Content */}
      <Card>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No requests found matching your criteria
            </div>
          ) : (
            <>
              {viewMode === 'batch' && (
                <BatchViewContent 
                  groupedBatches={groupedBatches}
                  isPending={approveRequestsMutation.isPending || rejectRequestsMutation.isPending}
                  onUpdateRequest={handleUpdateRequest}
                  selectedRequestId={selectedRequestId}
                  setSelectedRequestId={setSelectedRequestId}
                  rejectionReason={rejectionReason}
                  setRejectionReason={setRejectionReason}
                />
              )}
              
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {filteredRequests.map((request) => {
                    const enhancedRequest = transformToEnhancedRequest(request);
                    return (
                      <DetailedRequestCard
                        key={request.id}
                        request={enhancedRequest}
                        isSelected={selectedRequests.has(request.id)}
                        onSelect={(selected) => handleSelectRequest(request.id, selected)}
                        onViewDetails={() => setSelectedRequest(enhancedRequest)}
                        canManage={statusFilter === 'PENDING' && isAdmin}
                        onApprove={() => handleApproveRequest(request.id)}
                        onReject={(reason) => handleRejectRequest(request.id, reason)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => {
            handleApproveRequest(selectedRequest.id);
            setSelectedRequest(null);
          }}
          onReject={(reason) => {
            handleRejectRequest(selectedRequest.id, reason);
            setSelectedRequest(null);
          }}
        />
      )}
    </div>
  );
}
