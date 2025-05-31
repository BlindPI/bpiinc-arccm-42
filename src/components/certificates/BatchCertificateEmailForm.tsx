import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CertificateEmailParams } from '@/types/certificates';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

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
  const [templateId, setTemplateId] = useState('');
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

  const { data: templates } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*');
      
      if (error) throw error;
      return data || [];
    }
  });

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

      // Call the batch email function
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchRecord.id,
          userId: profile?.id
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
        <Alert variant="warning">
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

      <div>
        <Label htmlFor="template">Email Template</Label>
        <Select onValueChange={setTemplateId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an email template" />
          </SelectTrigger>
          <SelectContent>
            {templates?.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="message">Message (optional)</Label>
        <Textarea
          id="message"
          placeholder="Add a personalized message..."
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
