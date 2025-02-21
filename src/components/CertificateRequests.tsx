
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X, Clock, AlertCircle, FileCheck, Ban } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive", icon: React.ReactNode }> = {
    PENDING: { variant: "secondary", icon: <Clock className="w-3 h-3" /> },
    APPROVED: { variant: "default", icon: <FileCheck className="w-3 h-3" /> },
    REJECTED: { variant: "destructive", icon: <Ban className="w-3 h-3" /> }
  };

  const config = variants[status] || variants.PENDING;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {config.icon}
      {status}
    </Badge>
  );
};

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
                  <Alert key={request.id} variant="outline" className="relative">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <AlertTitle className="flex items-center gap-2">
                            {request.recipient_name}
                            <StatusBadge status={request.status} />
                          </AlertTitle>
                          <AlertDescription>
                            <div className="space-y-1 mt-2">
                              <p><strong>Course:</strong> {request.course_name}</p>
                              <p><strong>Issue Date:</strong> {request.issue_date}</p>
                              <p><strong>Expiry Date:</strong> {request.expiry_date}</p>
                            </div>
                          </AlertDescription>
                        </div>
                      </div>

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
                          <Check className="mr-2 h-4 w-4" />
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
                            <X className="mr-2 h-4 w-4" />
                            Confirm Rejection
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequestId(request.id)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        )}
                      </div>
                    </div>
                  </Alert>
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
                  <Alert key={request.id} variant="outline">
                    <div className="flex items-start justify-between">
                      <div>
                        <AlertTitle className="flex items-center gap-2">
                          {request.recipient_name}
                          <StatusBadge status={request.status} />
                        </AlertTitle>
                        <AlertDescription>
                          <div className="space-y-1 mt-2">
                            <p><strong>Course:</strong> {request.course_name}</p>
                            <p><strong>Issue Date:</strong> {request.issue_date}</p>
                            <p><strong>Expiry Date:</strong> {request.expiry_date}</p>
                            {request.rejection_reason && (
                              <p className="text-destructive">
                                <strong>Rejection Reason:</strong> {request.rejection_reason}
                              </p>
                            )}
                          </div>
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
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
