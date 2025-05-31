
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BatchCertificateEmailForm } from '../BatchCertificateEmailForm';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Certificate } from '@/types/certificates';

interface RosterEmailActionsProps {
  rosterId: string;
  certificateCount: number;
}

export function RosterEmailActions({ rosterId, certificateCount }: RosterEmailActionsProps) {
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);

  // Get certificates for this roster
  const { data: certificates, isLoading } = useQuery({
    queryKey: ['roster-certificates', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('roster_id', rosterId);
      
      if (error) throw error;
      return (data || []) as Certificate[];
    }
  });

  // Get email batch status for this roster
  const { data: emailBatches } = useQuery({
    queryKey: ['roster-email-batches', rosterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_batch_operations')
        .select('*')
        .eq('batch_name', `Roster ${rosterId}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const lastBatch = emailBatches?.[0];
  const certificateIds = certificates?.map(cert => cert.id) || [];
  
  const getEmailStatus = () => {
    if (!lastBatch) return 'none';
    if (lastBatch.status === 'PENDING' || lastBatch.status === 'PROCESSING') return 'processing';
    if (lastBatch.status === 'COMPLETED') return 'completed';
    if (lastBatch.status === 'FAILED') return 'failed';
    return 'none';
  };

  const getStatusBadge = () => {
    const status = getEmailStatus();
    switch (status) {
      case 'processing':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading || certificateCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEmailDialogOpen(true)}
        disabled={certificateIds.length === 0}
        className="gap-2"
      >
        <Mail className="h-4 w-4" />
        Email Certificates
        {certificateIds.length > 0 && (
          <Badge variant="secondary">{certificateIds.length}</Badge>
        )}
      </Button>

      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Roster Certificates</DialogTitle>
          </DialogHeader>
          <BatchCertificateEmailForm
            certificateIds={certificateIds}
            certificates={certificates || []}
            onClose={() => setIsEmailDialogOpen(false)}
            batchName={`Roster ${rosterId}`}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
