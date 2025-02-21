
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function CertificateRequests() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [rejectionReason, setRejectionReason] = React.useState<string>('');
  const [selectedRequestId, setSelectedRequestId] = React.useState<string | null>(null);

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

  const updateRequest = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      rejectionReason 
    }: { 
      id: string; 
      status: 'APPROVED' | 'REJECTED'; 
      rejectionReason?: string;
    }) => {
      const { error } = await supabase
        .from('certificate_requests')
        .update({ 
          status, 
          rejection_reason: rejectionReason,
          reviewer_id: profile?.id 
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      toast.success('Request updated successfully');
      setRejectionReason('');
      setSelectedRequestId(null);
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast.error('Failed to update request');
    },
  });

  const canManageRequests = profile?.role && ['SA', 'AD'].includes(profile.role);

  if (isLoading) {
    return <div>Loading requests...</div>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Certificate Requests</CardTitle>
        <CardDescription>
          {canManageRequests 
            ? 'Review and manage certificate requests' 
            : 'Your certificate requests'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests?.map((request) => (
            <Alert key={request.id} className="relative">
              <AlertTitle>
                {request.recipient_name} - {request.course_name}
              </AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <p>Status: {request.status}</p>
                  <p>Issue Date: {request.issue_date}</p>
                  <p>Expiry Date: {request.expiry_date}</p>
                  {request.rejection_reason && (
                    <p className="text-red-500">
                      Rejection Reason: {request.rejection_reason}
                    </p>
                  )}
                  
                  {canManageRequests && request.status === 'PENDING' && (
                    <div className="space-y-4 mt-4">
                      {selectedRequestId === request.id && (
                        <div className="space-y-2">
                          <Label htmlFor="rejectionReason">Rejection Reason</Label>
                          <Input
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection"
                          />
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => updateRequest.mutate({ 
                            id: request.id, 
                            status: 'APPROVED' 
                          })}
                          disabled={updateRequest.isPending}
                        >
                          <Check className="mr-2" />
                          Approve
                        </Button>
                        {selectedRequestId === request.id ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (!rejectionReason) {
                                toast.error('Please provide a rejection reason');
                                return;
                              }
                              updateRequest.mutate({ 
                                id: request.id, 
                                status: 'REJECTED',
                                rejectionReason 
                              });
                            }}
                            disabled={updateRequest.isPending}
                          >
                            <X className="mr-2" />
                            Confirm Rejection
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            <X className="mr-2" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}

          {requests?.length === 0 && (
            <p className="text-center text-muted-foreground">
              No certificate requests found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
