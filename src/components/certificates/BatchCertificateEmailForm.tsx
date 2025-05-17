import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: any[];
  onClose: () => void;
}

export function BatchCertificateEmailForm({ 
  certificateIds, 
  certificates,
  onClose 
}: BatchCertificateEmailFormProps) {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const { data: profile } = useProfile();
  
  const handleSendEmails = async () => {
    if (certificateIds.length === 0) {
      toast.error('No certificates selected for emails');
      return;
    }
    
    try {
      setIsSending(true);
      
      // Create batch operation record
      const { data: batchOp, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          total_certificates: certificateIds.length,
          processed_certificates: 0,
          status: 'PENDING',
          created_by: profile?.id
        })
        .select()
        .single();
        
      if (batchError) throw batchError;
      
      // Call the Edge Function to process emails in the background
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          certificates, // Pass full certificate objects
          batchId: batchOp.id,
          userId: profile?.id
        }
      });
      
      if (error) throw error;
      
      // Set up a progress polling interval
      const progressInterval = setInterval(async () => {
        const { data: progressData } = await supabase
          .from('email_batch_operations')
          .select('processed_certificates, total_certificates, status, successful_emails, failed_emails')
          .eq('id', batchOp.id)
          .single();
          
        if (progressData) {
          setProgress({
            processed: progressData.processed_certificates,
            total: progressData.total_certificates
          });
          
          // If complete, clear interval and show success
          if (progressData.status === 'COMPLETED') {
            clearInterval(progressInterval);
            setIsSending(false);
            toast.success(`Sent ${progressData.successful_emails} certificates successfully`);
            if (progressData.failed_emails > 0) {
              toast.error(`Failed to send ${progressData.failed_emails} emails`);
            }
            onClose();
          } else if (progressData.status === 'FAILED') {
            clearInterval(progressInterval);
            setIsSending(false);
            toast.error('Batch email process failed');
          }
        }
      }, 1500);
      
      // Clean up interval after 5 minutes max
      setTimeout(() => {
        clearInterval(progressInterval);
        if (isSending) {
          setIsSending(false);
          toast.info('Email sending continues in the background');
          onClose();
        }
      }, 300000);
      
      toast.success('Email sending process has started');
    } catch (error) {
      console.error('Error sending certificate emails:', error);
      setIsSending(false);
      toast.error(`Failed to send emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm space-y-2">
        <p>Sending emails to {certificateIds.length} recipients</p>
        
        {isSending && progress.total > 0 && (
          <div className="bg-blue-50 p-3 rounded text-blue-700">
            Processing: {progress.processed} of {progress.total} ({Math.round((progress.processed / progress.total) * 100)}%)
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button 
          type="button" 
          className="gap-1" 
          onClick={handleSendEmails}
          disabled={isSending}
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send Emails
            </>
          )}
        </Button>
      </div>
    </div>
  );
}