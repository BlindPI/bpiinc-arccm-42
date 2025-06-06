
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RosterService } from '@/services/roster/rosterService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye, Edit, Trash2, Download, Mail, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RosterValidationPanel } from './RosterValidationPanel';
import { RosterCountIndicator } from './RosterCountIndicator';
import { RosterEmailStatusBadge } from './RosterEmailStatusBadge';
import { BatchCertificateEmailForm } from '@/components/certificates/BatchCertificateEmailForm';
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';
import { useCacheRefresh } from '@/hooks/useCacheRefresh';

export const RosterManagement: React.FC = () => {
  const [selectedRoster, setSelectedRoster] = useState<string | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedRosterForEmail, setSelectedRosterForEmail] = useState<{
    rosterId: string;
    rosterName: string;
    certificates: Certificate[];
  } | null>(null);
  const queryClient = useQueryClient();
  const { refreshEmailStatus, refreshAllRosterData } = useCacheRefresh();

  const { data: rosters, isLoading } = useQuery({
    queryKey: ['rosters'],
    queryFn: () => RosterService.getAllRosters(),
    staleTime: 30000, // 30 seconds - shorter cache time
    gcTime: 60000 // 1 minute
  });

  const deleteRosterMutation = useMutation({
    mutationFn: (id: string) => RosterService.deleteRoster(id),
    onSuccess: () => {
      toast.success('Roster deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
    },
    onError: (error: any) => {
      toast.error(`Failed to delete roster: ${error.message}`);
    }
  });

  const handleDeleteRoster = (id: string) => {
    if (confirm('Are you sure you want to delete this roster?')) {
      deleteRosterMutation.mutate(id);
    }
  };

  const handleEmailRoster = async (rosterId: string, rosterName: string) => {
    try {
      const { data: certificates, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', rosterId);

      if (error) throw error;

      if (!certificates || certificates.length === 0) {
        toast.warning('No certificates found for this roster');
        return;
      }

      const certsWithoutEmail = certificates.filter(cert => !cert.recipient_email);
      if (certsWithoutEmail.length > 0) {
        toast.warning(`${certsWithoutEmail.length} certificates have no email address`);
      }

      setSelectedRosterForEmail({
        rosterId,
        rosterName,
        certificates: certificates as Certificate[]
      });
      setEmailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching roster certificates:', error);
      toast.error('Failed to load roster certificates');
    }
  };

  const getStatusVariant = (status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT') => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'ARCHIVED': return 'secondary';
      case 'DRAFT': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Roster Management</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Loading rosters...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Roster Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage course rosters and certificate batches
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={refreshEmailStatus}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Email Status
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Roster
            </Button>
          </div>
        </div>

        {/* Validation Panel */}
        <RosterValidationPanel />

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              All Rosters
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshAllRosterData}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!rosters || rosters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rosters found</p>
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Roster
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Certificates</TableHead>
                    <TableHead>Email Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rosters.map((roster) => (
                    <TableRow key={roster.id}>
                      <TableCell className="font-medium">{roster.name}</TableCell>
                      <TableCell>{roster.course?.name || 'N/A'}</TableCell>
                      <TableCell>{roster.location?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <RosterCountIndicator 
                          rosterId={roster.id}
                          storedCount={roster.certificate_count}
                        />
                      </TableCell>
                      <TableCell>
                        <RosterEmailStatusBadge 
                          rosterId={roster.id}
                          certificateCount={roster.certificate_count}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(roster.status)}>
                          {roster.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(roster.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRoster(roster.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {roster.certificate_count > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEmailRoster(roster.id, roster.name)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRoster(roster.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Roster Certificates</DialogTitle>
          </DialogHeader>
          {selectedRosterForEmail && (
            <BatchCertificateEmailForm
              certificateIds={selectedRosterForEmail.certificates.map(cert => cert.id)}
              certificates={selectedRosterForEmail.certificates}
              onClose={() => {
                setEmailDialogOpen(false);
                setSelectedRosterForEmail(null);
                // Refresh email status after dialog closes
                refreshEmailStatus();
              }}
              batchName={`Roster ${selectedRosterForEmail.rosterName}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
