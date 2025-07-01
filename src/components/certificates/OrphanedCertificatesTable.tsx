
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';

interface OrphanedCertificate {
  id: string;
  recipient_name: string;
  course_name: string;
  generation_status: string;
  created_at: string;
  certificate_url: string | null;
}

export function OrphanedCertificatesTable() {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = profile?.role && ['SA', 'AD'].includes(profile.role);

  const { data: orphanedCertificates = [], isLoading } = useQuery({
    queryKey: ['orphaned-certificates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .in('generation_status', ['PENDING', 'FAILED'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as OrphanedCertificate[];
    },
    enabled: isAdmin,
  });

  const deleteCertificateMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .delete()
        .eq('id', certificateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Orphaned certificate deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['orphaned-certificates'] });
    },
    onError: (error) => {
      console.error('Error deleting certificate:', error);
      toast.error(`Failed to delete certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
    onSettled: () => {
      setDeletingId(null);
    }
  });

  const markCompletedMutation = useMutation({
    mutationFn: async (certificateId: string) => {
      const { error } = await supabase
        .from('certificates')
        .update({ generation_status: 'COMPLETED' })
        .eq('id', certificateId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Certificate marked as completed');
      queryClient.invalidateQueries({ queryKey: ['orphaned-certificates'] });
    },
    onError: (error) => {
      console.error('Error updating certificate:', error);
      toast.error(`Failed to update certificate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });

  const handleDelete = (certificateId: string) => {
    setDeletingId(certificateId);
    deleteCertificateMutation.mutate(certificateId);
  };

  const handleMarkCompleted = (certificateId: string) => {
    markCompletedMutation.mutate(certificateId);
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
            Orphaned Certificates
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Orphaned Certificates ({orphanedCertificates.length})
        </CardTitle>
        {orphanedCertificates.length > 0 && (
          <p className="text-sm text-muted-foreground">
            These certificate records were created but never completed generation. They should be cleaned up.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {orphanedCertificates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No orphaned certificates found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Has PDF</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orphanedCertificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className="font-medium">{certificate.recipient_name}</TableCell>
                  <TableCell>{certificate.course_name}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={certificate.generation_status === 'FAILED' ? 'destructive' : 'secondary'}
                    >
                      {certificate.generation_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(certificate.created_at), 'MMM d, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={certificate.certificate_url ? 'success' : 'secondary'}>
                      {certificate.certificate_url ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {certificate.certificate_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkCompleted(certificate.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Complete
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(certificate.id)}
                        disabled={deletingId === certificate.id}
                      >
                        {deletingId === certificate.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Delete
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
  );
}
