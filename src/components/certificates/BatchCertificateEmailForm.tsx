
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProfile } from '@/hooks/useProfile';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, MapPin } from 'lucide-react';
import { Certificate } from '@/types/certificates';
import { EmailBatchProgress } from './EmailBatchProgress';
import { EmailService } from '@/services/emailService';

interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: Certificate[];
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
  const [showProgress, setShowProgress] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
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
  const certificatesByLocation = certificates.reduce((acc: Record<string, Certificate[]>, cert) => {
    const locationId = cert.location_id || 'no-location';
    if (!acc[locationId]) acc[locationId] = [];
    acc[locationId].push(cert);
    return acc;
  }, {});

  const sendBatchEmailsMutation = useMutation({
    mutationFn: async () => {
      const result = await EmailService.sendBatchCertificateEmails({
        certificateIds,
        customMessage: message,
        batchName: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`
      });

      setBatchId(result.batchId);
      setShowProgress(true);
      return result;
    },
    onSuccess: (result) => {
      toast.success(`Batch email process started for ${certificateIds.length} certificates`);
      queryClient.invalidateQueries({ queryKey: ['email-batch-operations'] });
      queryClient.invalidateQueries({ queryKey: ['roster-email-batches'] });
    },
    onError: (error) => {
      console.error('Error sending batch emails:', error);
      toast.error(`Failed to send batch emails: ${error.message}`);
      setShowProgress(false);
      setBatchId(null);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendBatchEmailsMutation.mutate();
  };

  const handleProgressComplete = () => {
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  if (showProgress && batchId) {
    return (
      <div className="space-y-4">
        <DialogHeader>
          <DialogTitle>Sending Batch Emails</DialogTitle>
          <DialogDescription>
            Please wait while we send emails to all recipients...
          </DialogDescription>
        </DialogHeader>
        
        <EmailBatchProgress 
          batchId={batchId} 
          onComplete={handleProgressComplete}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Send Batch Certificate Emails</DialogTitle>
        <DialogDescription>
          Send certificates to multiple recipients at once using location-specific email templates.
        </DialogDescription>
      </DialogHeader>

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
          {sendBatchEmailsMutation.isPending ? 'Starting...' : 'Send Batch Emails'}
        </Button>
      </DialogFooter>
    </form>
  );
}
