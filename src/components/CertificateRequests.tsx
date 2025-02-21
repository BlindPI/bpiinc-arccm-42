
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock, FileCheck } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useFontLoader } from '@/hooks/useFontLoader';
import { RequestCard } from './certificates/RequestCard';
import { useCertificateRequest } from '@/hooks/useCertificateRequest';

export function CertificateRequests() {
  const { data: profile } = useProfile();
  const [rejectionReason, setRejectionReason] = React.useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);
  const { fontCache } = useFontLoader();
  const updateRequest = useCertificateRequest();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['certificateRequests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleUpdateRequest = ({ 
    id, 
    status, 
    rejectionReason 
  }: { 
    id: string; 
    status: 'APPROVED' | 'REJECTED'; 
    rejectionReason?: string;
  }) => {
    updateRequest.mutate({ 
      id, 
      status, 
      rejectionReason,
      profile,
      fontCache
    }, {
      onSuccess: () => {
        setRejectionReason('');
        setSelectedRequestId(null);
      }
    });
  };

  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <AlertCircle className="h-6 w-6 animate-pulse text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'PENDING') || [];
  const otherRequests = requests?.filter(r => r.status !== 'PENDING') || [];

  return (
    <div className="space-y-6">
      {canManageRequests && pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onUpdateRequest={handleUpdateRequest}
                    selectedRequestId={selectedRequestId}
                    setSelectedRequestId={setSelectedRequestId}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    isPending={updateRequest.isPending}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {otherRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-muted-foreground" />
              {canManageRequests ? 'Processed Requests' : 'Your Requests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {otherRequests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    isProcessed={true}
                    onUpdateRequest={handleUpdateRequest}
                    selectedRequestId={selectedRequestId}
                    setSelectedRequestId={setSelectedRequestId}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    isPending={updateRequest.isPending}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {requests?.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No certificate requests found
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
