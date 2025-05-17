The errors indicate syntax issues. Let me provide a clean version of the file:

```tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, DownloadIcon, EditIcon, TrashIcon, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RosterDetailProps, Roster } from '@/types/roster';
import { format } from 'date-fns';
import { RosterStatistics } from './RosterStatistics';
import { CertificatesTable } from '../certificates/CertificatesTable';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { BatchCertificateEmailForm } from '../certificates/BatchCertificateEmailForm';

export const RosterDetailsView: React.FC<RosterDetailProps> = ({ 
  roster, 
  onBack,
  onEdit 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Delete roster mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('rosters')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rosters'] });
      toast({
        title: 'Roster deleted',
        description: 'The roster has been deleted successfully.'
      });
      onBack();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete roster: ${error.message}`,
        variant: 'destructive'
      });
    }
  });

  // Fetch certificates for this roster
  useEffect(() => {
    async function fetchCertificates() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('certificates')
          .select('*')
          .eq('roster_id', roster.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setCertificates(data || []);
      } catch (error) {
        console.error('Error fetching certificates:', error);
        toast({
          title: 'Error',
          description: 'Failed to load certificates',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (roster?.id) {
      fetchCertificates();
    }
  }, [roster?.id, toast]);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this roster? This action cannot be undone.')) {
      deleteMutation.mutate(roster.id);
    }
  };

  const handleOpenEmailDialog = () => {
    if (certificates.length === 0) {
      toast({
        title: 'Warning',
        description: 'No certificates available to email',
        variant: 'warning'
      });
      return;
    }
    setIsEmailDialogOpen(true);
  };

  // Format the creation date
  const formattedDate = roster?.created_at 
    ? format(new Date(roster.created_at), 'MMMM d, yyyy')
    : 'Unknown';

  if (!roster) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" /> Back to Rosters
        </Button>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onEdit(roster)}
            className="gap-2"
          >
            <EditIcon className="h-4 w-4" /> Edit
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete}
            className="gap-2"
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{roster.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-md mt-1">{roster.description || 'No description provided.'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Course</Label>
                <p className="text-md mt-1">{roster.course?.name || 'No course selected.'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Location</Label>
                <p className="text-md mt-1">{roster.location?.name || 'No location selected.'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Issue Date</Label>
                <p className="text-md mt-1">{roster.issue_date || 'Not specified'}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-md mt-1">{formattedDate}</p>
              </div>
              
              <div>
                <Label className="text-muted-foreground">Created By</Label>
                <p className="text-md mt-1">
                  {roster.creator?.display_name || 'Unknown'}
                </p>
              </div>
            </div>
            
            <RosterStatistics rosterId={roster.id} />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Certificates ({certificates?.length || 0})</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleOpenEmailDialog} className="gap-2">
              <Mail className="h-4 w-4" /> Email All
            </Button>
            <Button variant="outline" className="gap-2">
              <DownloadIcon className="h-4 w-4" /> Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CertificatesTable 
            certificates={certificates}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <BatchCertificateEmailForm
            certificateIds={certificates.map(cert => cert.id)}
            certificates={certificates}
            onClose={() => setIsEmailDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
```