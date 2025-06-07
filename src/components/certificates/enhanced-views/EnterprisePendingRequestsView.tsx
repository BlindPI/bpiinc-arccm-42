
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Layers, 
  Package, 
  User, 
  RefreshCw,
  FileText,
  Download
} from 'lucide-react';
import { EnterpriseBatchGroup } from '../enhanced-requests/EnterpriseBatchGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CertificateRequest } from '@/types/supabase-schema';
import { useProfile } from '@/hooks/useProfile';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';

// Extended type with enterprise metadata
interface EnhancedCertificateRequest extends CertificateRequest {
  submitter_name?: string;
  submitter_email?: string;
  location_name?: string;
  location_address?: string;
}

export function EnterprisePendingRequestsView() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const updateRequestMutation = useCertificateRequest();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [globalRejectionReason, setGlobalRejectionReason] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  // Simplified query to avoid database relation errors
  const { data: requests, isLoading, refetch } = useQuery({
    queryKey: ['enterprise-pending-requests', searchQuery],
    queryFn: async () => {
      console.log('Fetching enterprise pending requests...');
      
      let query = supabase
        .from('certificate_requests')
        .select('*')
        .eq('status', 'PENDING');

      if (searchQuery) {
        query = query.or(`recipient_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,course_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching requests:', error);
        throw error;
      }
      
      // Get unique user IDs for submitter info
      const userIds = [...new Set((data || []).map(r => r.user_id).filter(Boolean))];
      let submitterData: Record<string, { display_name: string; email: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);
        
        if (profiles) {
          submitterData = profiles.reduce((acc, profile) => {
            acc[profile.id] = {
              display_name: profile.display_name || 'Unknown',
              email: profile.email || ''
            };
            return acc;
          }, {} as Record<string, { display_name: string; email: string }>);
        }
      }

      // Get unique location IDs for location info
      const locationIds = [...new Set((data || []).map(r => r.location_id).filter(Boolean))];
      let locationData: Record<string, { name: string; address: string }> = {};
      
      if (locationIds.length > 0) {
        const { data: locations } = await supabase
          .from('locations')
          .select('id, name, address, city')
          .in('id', locationIds);
        
        if (locations) {
          locationData = locations.reduce((acc, location) => {
            acc[location.id] = {
              name: location.name || '',
              address: [location.address, location.city].filter(Boolean).join(', ') || ''
            };
            return acc;
          }, {} as Record<string, { name: string; address: string }>);
        }
      }
      
      // Transform the data to include metadata
      const transformedData = (data || []).map(record => ({
        ...record,
        submitter_name: record.user_id ? submitterData[record.user_id]?.display_name || 'Unknown' : 'Unknown',
        submitter_email: record.user_id ? submitterData[record.user_id]?.email || '' : '',
        location_name: record.location_id ? locationData[record.location_id]?.name || '' : '',
        location_address: record.location_id ? locationData[record.location_id]?.address || '' : ''
      })) as EnhancedCertificateRequest[];
      
      console.log(`Fetched ${transformedData.length} pending requests`);
      return transformedData;
    },
    enabled: !!profile
  });

  // Group requests by batch with enterprise metadata
  const groupedBatches = React.useMemo(() => {
    if (!requests?.length) return [];
    
    const batches: Record<string, EnhancedCertificateRequest[]> = {};
    
    requests.forEach(request => {
      const batchKey = request.batch_id || `individual_${request.id}`;
      
      if (!batches[batchKey]) {
        batches[batchKey] = [];
      }
      
      batches[batchKey].push(request);
    });
    
    return Object.entries(batches)
      .map(([batchId, requests]) => {
        const firstRequest = requests[0];
        
        return {
          batchId,
          batchName: batchId.startsWith('individual_') 
            ? `Individual Request - ${firstRequest.recipient_name}`
            : firstRequest.batch_name || `Batch ${batchId.slice(0, 8)}`,
          submittedAt: firstRequest.created_at,
          submittedBy: firstRequest.submitter_name || 'Unknown',
          requests: requests.sort((a, b) => 
            a.recipient_name.localeCompare(b.recipient_name)
          )
        };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [requests]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Requests refreshed');
    } catch (error) {
      toast.error('Failed to refresh requests');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateRequest = async (params: {
    id: string;
    status: 'APPROVED' | 'REJECTED' | 'ARCHIVED';
    rejectionReason?: string;
  }) => {
    try {
      await updateRequestMutation.mutateAsync({
        ...params,
        profile
      });
    } catch (error) {
      console.error('Error updating request:', error);
    }
  };

  const handleExportBatch = () => {
    // TODO: Implement batch export functionality
    toast.info('Export functionality coming soon');
  };

  // Calculate statistics
  const totalRequests = requests?.length || 0;
  const batchSubmissions = groupedBatches.filter(batch => !batch.batchId.startsWith('individual_'));
  const individualSubmissions = groupedBatches.filter(batch => batch.batchId.startsWith('individual_'));
  const failedAssessments = requests?.filter(r => r.assessment_status === 'FAIL').length || 0;

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4">Loading pending requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Enterprise Pending Requests
            </CardTitle>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportBatch}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Enterprise Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalRequests}</div>
              <div className="text-sm text-muted-foreground">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{batchSubmissions.length}</div>
              <div className="text-sm text-muted-foreground">Batch Submissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{individualSubmissions.length}</div>
              <div className="text-sm text-muted-foreground">Individual Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedAssessments}</div>
              <div className="text-sm text-muted-foreground">Failed Assessments</div>
            </div>
          </div>

          {/* Global Rejection Reason */}
          {isAdmin && batchSubmissions.length > 0 && (
            <div className="max-w-md">
              <Label htmlFor="global-rejection-reason">
                Global Rejection Reason (for bulk actions)
              </Label>
              <Input
                id="global-rejection-reason"
                placeholder="Enter reason for batch rejections..."
                value={globalRejectionReason}
                onChange={(e) => setGlobalRejectionReason(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Groups */}
      {groupedBatches.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No pending certificate requests found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Batch Submissions First */}
          {batchSubmissions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                Batch Submissions ({batchSubmissions.length})
              </h3>
              {batchSubmissions.map(batch => (
                <EnterpriseBatchGroup
                  key={batch.batchId}
                  batchId={batch.batchId}
                  batchName={batch.batchName}
                  requests={batch.requests}
                  submittedBy={batch.submittedBy}
                  submittedAt={batch.submittedAt}
                  isPending={updateRequestMutation.isPending}
                  onUpdateRequest={handleUpdateRequest}
                  globalRejectionReason={globalRejectionReason}
                  setGlobalRejectionReason={setGlobalRejectionReason}
                />
              ))}
            </div>
          )}

          {/* Individual Submissions */}
          {individualSubmissions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Individual Requests ({individualSubmissions.length})
              </h3>
              {individualSubmissions.map(batch => (
                <EnterpriseBatchGroup
                  key={batch.batchId}
                  batchId={batch.batchId}
                  batchName={batch.batchName}
                  requests={batch.requests}
                  submittedBy={batch.submittedBy}
                  submittedAt={batch.submittedAt}
                  isPending={updateRequestMutation.isPending}
                  onUpdateRequest={handleUpdateRequest}
                  globalRejectionReason={globalRejectionReason}
                  setGlobalRejectionReason={setGlobalRejectionReason}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Notice */}
      {!isAdmin && (
        <Card>
          <CardContent className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800">
            <strong>Note:</strong> You are viewing certificate requests in read-only mode. 
            Only System Administrators and Administrators can approve, reject, or archive requests.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
