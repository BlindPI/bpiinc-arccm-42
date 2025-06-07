
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
import { DetailedRequestCard } from './DetailedRequestCard';
import { BulkActionBar } from './BulkActionBar';
import { RequestDetailsModal } from './RequestDetailsModal';
import { BatchViewContent } from '../BatchViewContent';
import { EnhancedCertificateRequest } from '@/types/certificateValidation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CertificateRequest } from '@/types/supabase-schema';
import { useProfile } from '@/hooks/useProfile';
import { useEnhancedCertificateRequests } from '@/hooks/useEnhancedCertificateRequests';

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
    email: dbRecord.email || '',
    phone: dbRecord.phone || '',
    company: dbRecord.company || '',
    courseName: dbRecord.course_name || '',
    courseId: dbRecord.id || '', // Using request id as courseId fallback
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
        batchName: batchId === 'no-batch' 
          ? `Individual Request - ${firstRequest.recipient_name}`
          : firstRequest.batch_name || `Batch ${batchId.slice(0, 8)}`,
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
  const { handleApprove, handleReject, isProcessing } = useEnhancedCertificateRequests(profile);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<EnhancedCertificateRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [viewMode, setViewMode] = useState<'batch' | 'list'>('batch');
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch certificate requests from database
  const { data: requests = [], isLoading, error } = useQuery({
    queryKey: ['enhanced-certificate-requests', statusFilter, profile?.id],
    queryFn: async () => {
      console.log('Fetching enhanced certificate requests');
      
      try {
        let query = supabase
          .from('certificate_requests')
          .select(`
            *,
            submitter:user_id(
              id,
              display_name,
              email
            )
          `);
        
        // Filter by status
        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter);
        }
        
        // Filter by user if not admin
        const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);
        if (!isAdmin && profile?.id) {
          query = query.eq('user_id', profile.id);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching certificate requests:', error);
          throw error;
        }
        
        console.log(`Successfully fetched ${data?.length || 0} enhanced certificate requests`);
        return data as CertificateRequestWithSubmitter[];
      } catch (error) {
        console.error('Error in enhanced certificate requests query:', error);
        toast.error(`Failed to fetch certificate requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
        throw error;
      }
    },
    enabled: !!profile,
  });

  // Filter requests based on search query
  const filteredRequests = React.useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(request => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          request.recipient_name?.toLowerCase().includes(searchLower) ||
          request.email?.toLowerCase().includes(searchLower) ||
          request.course_name?.toLowerCase().includes(searchLower)
        );
      }
      return true;
    });
  }, [requests, searchQuery]);

  // Group requests by batch
  const groupedBatches = groupRequestsByRealBatch(filteredRequests);

  // Transform for enhanced view
  const enhancedRequests = filteredRequests.map(transformToEnhancedRequest);

  // Handle bulk approve
  const handleBulkApprove = async () => {
    const requestIds = Array.from(selectedRequests);
    for (const id of requestIds) {
      try {
        await handleApprove(id);
      } catch (error) {
        console.error(`Failed to approve request ${id}:`, error);
      }
    }
    setSelectedRequests(new Set());
  };

  // Handle bulk reject
  const handleBulkReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    const requestIds = Array.from(selectedRequests);
    for (const id of requestIds) {
      try {
        await handleReject(id, rejectionReason);
      } catch (error) {
        console.error(`Failed to reject request ${id}:`, error);
      }
    }
    setSelectedRequests(new Set());
    setRejectionReason('');
  };

  // Handle export
  const handleExport = () => {
    const dataToExport = selectedRequests.size > 0 
      ? enhancedRequests.filter(req => selectedRequests.has(req.id))
      : enhancedRequests;

    const csvContent = [
      ['Name', 'Email', 'Course', 'Status', 'Assessment', 'Submitted Date'].join(','),
      ...dataToExport.map(req => [
        req.recipientName,
        req.email,
        req.courseName,
        req.status,
        req.assessmentStatus || 'N/A',
        new Date(req.submittedAt).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-requests-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success('Certificate requests exported successfully');
  };

  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading certificate requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              {canManageRequests ? 'Pending Certificate Requests' : 'Your Certificate Requests'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* View Toggle */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={viewMode === 'batch' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('batch')}
            >
              <Layers className="h-4 w-4 mr-2" />
              Batch View
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>

          {/* Bulk Actions */}
          {canManageRequests && selectedRequests.size > 0 && (
            <BulkActionBar
              selectedCount={selectedRequests.size}
              onApproveAll={handleBulkApprove}
              onRejectAll={handleBulkReject}
              onClearSelection={() => setSelectedRequests(new Set())}
              rejectionReason={rejectionReason}
              onRejectionReasonChange={setRejectionReason}
              isProcessing={isProcessing}
            />
          )}

          {/* Content */}
          {viewMode === 'batch' ? (
            <BatchViewContent 
              groupedBatches={groupedBatches}
              isPending={isProcessing}
              onUpdateRequest={async (params) => {
                if (params.status === 'APPROVED') {
                  await handleApprove(params.id);
                } else if (params.status === 'REJECTED') {
                  await handleReject(params.id, params.rejectionReason || '');
                }
              }}
              selectedRequestId={null}
              setSelectedRequestId={() => {}}
              rejectionReason={rejectionReason}
              setRejectionReason={setRejectionReason}
            />
          ) : (
            <div className="grid gap-4">
              {enhancedRequests.map((request) => (
                <DetailedRequestCard
                  key={request.id}
                  request={request}
                  isSelected={selectedRequests.has(request.id)}
                  onToggleSelect={(id) => {
                    const newSelection = new Set(selectedRequests);
                    if (newSelection.has(id)) {
                      newSelection.delete(id);
                    } else {
                      newSelection.add(id);
                    }
                    setSelectedRequests(newSelection);
                  }}
                  onView={() => setSelectedRequest(request)}
                  onApprove={() => handleApprove(request.id)}
                  onReject={(reason) => handleReject(request.id, reason)}
                  canManage={canManageRequests}
                  isProcessing={isProcessing}
                />
              ))}
              
              {enhancedRequests.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No certificate requests found</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          open={!!selectedRequest}
          onOpenChange={(open) => !open && setSelectedRequest(null)}
          onApprove={() => {
            handleApprove(selectedRequest.id);
            setSelectedRequest(null);
          }}
          onReject={(reason) => {
            handleReject(selectedRequest.id, reason);
            setSelectedRequest(null);
          }}
          canManage={canManageRequests}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
