
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FailedRequest {
  id: string;
  recipient_name: string;
  course_name: string;
  generation_error: string;
  generation_attempts: number;
  last_generation_attempt: string;
  created_at: string;
  location_id?: string;
}

export function FailedGenerationsTable() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FailedRequest | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: failedRequests = [], isLoading } = useQuery({
    queryKey: ['failed-certificate-generations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('status', 'GENERATION_FAILED')
        .order('last_generation_attempt', { ascending: false });

      if (error) throw error;
      return data as FailedRequest[];
    },
    enabled: isAdmin,
  });

  const retryGenerationMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: {
          requestId,
          issuerId: profile?.id
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      return data;
    },
    onSuccess: () => {
      toast.success('Certificate generation retried successfully');
      queryClient.invalidateQueries({ queryKey: ['failed-certificate-generations'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    },
    onError: (error) => {
      console.error('Error retrying generation:', error);
      toast.error(`Failed to retry generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => {
      setRetryingId(null);
    }
  });

  const uploadCertificateMutation = useMutation({
    mutationFn: async ({ requestId, file }: { requestId: string; file: File }) => {
      // Upload file to storage
      const fileName = `manual_certificate_${requestId}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('certification-pdfs')
        .upload(fileName, file, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('certification-pdfs')
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      // Get request details
      const { data: request, error: requestError } = await supabase
        .from('certificate_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError || !request) {
        throw new Error('Request not found');
      }

      // Generate verification code
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let verificationCode = '';
      
      for (let i = 0; i < 3; i++) {
        verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      for (let i = 0; i < 5; i++) {
        verificationCode += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      for (let i = 0; i < 2; i++) {
        verificationCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Create certificate record
      const { data: certificate, error: certError } = await supabase
        .from('certificates')
        .insert({
          recipient_name: request.recipient_name,
          course_name: request.course_name,
          issue_date: request.issue_date,
          expiry_date: request.expiry_date,
          verification_code: verificationCode,
          issued_by: profile?.id,
          certificate_request_id: requestId,
          status: 'ACTIVE',
          location_id: request.location_id,
          certificate_url: publicUrlData.publicUrl,
          generation_status: 'COMPLETED'
        })
        .select()
        .single();

      if (certError) throw certError;

      // Archive the request
      const { error: archiveError } = await supabase
        .from('certificate_requests')
        .update({
          status: 'ARCHIVED',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (archiveError) throw archiveError;

      return certificate;
    },
    onSuccess: () => {
      toast.success('Certificate uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['failed-certificate-generations'] });
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
      setUploadDialogOpen(false);
      setUploadFile(null);
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Error uploading certificate:', error);
      toast.error(`Failed to upload certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => {
      setUploading(false);
    }
  });

  const handleRetry = (requestId: string) => {
    setRetryingId(requestId);
    retryGenerationMutation.mutate(requestId);
  };

  const handleUpload = (request: FailedRequest) => {
    setSelectedRequest(request);
    setUploadDialogOpen(true);
  };

  const handleUploadSubmit = () => {
    if (!selectedRequest || !uploadFile) return;
    
    setUploading(true);
    uploadCertificateMutation.mutate({
      requestId: selectedRequest.id,
      file: uploadFile
    });
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Failed Certificate Generations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Failed Certificate Generations ({failedRequests.length})
          </CardTitle>
          {failedRequests.length > 0 && (
            <p className="text-sm text-muted-foreground">
              These certificate requests failed during PDF generation and can be retried or manually uploaded.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {failedRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No failed certificate generations found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.recipient_name}</TableCell>
                    <TableCell>{request.course_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {request.generation_attempts} attempt{request.generation_attempts !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.last_generation_attempt 
                        ? format(new Date(request.last_generation_attempt), 'MMM d, yyyy HH:mm')
                        : 'N/A'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-red-600" title={request.generation_error}>
                        {request.generation_error || 'Unknown error'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(request.id)}
                          disabled={retryingId === request.id}
                        >
                          {retryingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpload(request)}
                        >
                          <Upload className="h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Certificate Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-muted p-3 rounded">
                <p className="text-sm font-medium">{selectedRequest.recipient_name}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.course_name}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="certificate-file">Certificate PDF File</Label>
              <Input
                id="certificate-file"
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadSubmit}
                disabled={!uploadFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
