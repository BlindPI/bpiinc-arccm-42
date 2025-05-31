
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MapPin } from 'lucide-react';

interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: any[];
  onClose: () => void;
  batchName?: string;
}

export function BatchCertificateEmailForm({ 
  certificateIds, 
  certificates, 
  onClose, 
  batchName 
}: BatchCertificateEmailFormProps) {
  const [message, setMessage] = useState('');
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  
  // Check if all selected certificates have recipients with emails
  const certsWithoutEmail = certificates
    .filter(cert => !cert.recipient_email)
    .map(cert => cert.recipient_name);
    
  // Check if all selected certificates have certificate URLs
  const certsWithoutUrl = certificates
    .filter(cert => !cert.certificate_url)
    .map(cert => cert.recipient_name);

  // Group certificates by location for proper template handling
  const certificatesByLocation = certificates.reduce((acc, cert) => {
    const locationId = cert.location_id || 'no-location';
    if (!acc[locationId]) {
      acc[locationId] = [];
    }
    acc[locationId].push(cert);
    return acc;
  }, {} as Record<string, any[]>);

  const sendBatchEmailsMutation = useMutation({
    mutationFn: async () => {
      // Create batch operation record
      const { data: batchRecord, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          user_id: profile?.id,
          total_certificates: certificateIds.length,
          batch_name: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`,
          status: 'PENDING'
        })
        .select()
        .single();

      if (batchError) throw batchError;

      // Call the batch email function - it will automatically handle location-based templates
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchRecord.id,
          userId: profile?.id,
          customMessage: message
        }
      });

      if (error) throw error;
      return { batchId: batchRecord.id, ...data };
    },
    onSuccess: (result) => {
      toast.success(`Batch email process started for ${certificateIds.length} certificates`);
      queryClient.invalidateQueries({ queryKey: ['email-batch-operations'] });
      queryClient.invalidateQueries({ queryKey: ['roster-email-batches'] });
      onClose();
    },
    onError: (error) => {
      console.error('Error sending batch emails:', error);
      toast.error(`Failed to send batch emails: ${error.message}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendBatchEmailsMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {certsWithoutEmail.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning: Missing Emails</AlertTitle>
          <AlertDescription>
            The following recipients do not have email addresses and will be skipped:
            <ul className="list-disc pl-5 mt-1">
              {certsWithoutEmail.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {certsWithoutUrl.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Warning: Certificates Missing</AlertTitle>
          <AlertDescription>
            The following recipients do not have certificates generated yet:
            <ul className="list-disc pl-5 mt-1">
              {certsWithoutUrl.map(name => (
                <li key={name}>{name}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Show location-based template information */}
      {Object.keys(certificatesByLocation).length > 1 && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertTitle>Multiple Locations Detected</AlertTitle>
          <AlertDescription>
            Certificates from {Object.keys(certificatesByLocation).length} different locations will automatically use their respective email templates:
            <ul className="list-disc pl-5 mt-1">
              {Object.entries(certificatesByLocation).map(([locationId, certs]) => (
                <li key={locationId}>
                  {locationId === 'no-location' ? 'No Location' : `Location ${locationId.slice(-8)}`}: {certs.length} certificates
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="message">Custom Message (optional)</Label>
        <Textarea
          id="message"
          placeholder="Add a personalized message to include with all certificates..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={sendBatchEmailsMutation.isPending}>
          {sendBatchEmailsMutation.isPending ? 'Sending...' : 'Send Batch Emails'}
        </Button>
      </DialogFooter>
    </form>
  );
}
