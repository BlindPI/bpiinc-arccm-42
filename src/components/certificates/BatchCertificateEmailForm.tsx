
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface BatchCertificateEmailFormProps {
  certificateIds: string[];
  certificates: any[];
  onClose: () => void;
}

// Create a query client specifically for this component
const queryClient = new QueryClient();

export function BatchCertificateEmailForm({
  certificateIds,
  certificates,
  onClose
}: BatchCertificateEmailFormProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <BatchCertificateEmailFormContent 
        certificateIds={certificateIds} 
        certificates={certificates} 
        onClose={onClose}
      />
    </QueryClientProvider>
  );
}

function BatchCertificateEmailFormContent({
  certificateIds,
  certificates,
  onClose
}: BatchCertificateEmailFormProps) {
  const [isSending, setIsSending] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, success: 0, failed: 0 });
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: profile, isLoading: profileLoading, error: profileError } = useProfile();
  
  // Check for certificates without PDFs
  const certificatesWithoutPdf = certificates.filter(cert => 
    !cert.certificate_url || cert.certificate_url.trim() === ''
  ).length;
  
  // Check if there's a profile error and show it
  useEffect(() => {
    if (profileError) {
      console.error('Error loading profile:', profileError);
      setError('Unable to access your profile. Please try refreshing the page.');
    }
  }, [profileError]);
  
  // Poll for batch status updates
  useEffect(() => {
    if (!batchId) return;
    
    const interval = setInterval(async () => {
      try {
        const { data: progressData, error } = await supabase
          .from('email_batch_operations')
          .select('processed_certificates, total_certificates, status, successful_emails, failed_emails, error_message')
          .eq('id', batchId)
          .single();
          
        if (error) {
          console.error('Error fetching batch progress:', error);
          return;
        }
          
        if (progressData) {
          setProgress({
            processed: progressData.processed_certificates,
            total: progressData.total_certificates,
            success: progressData.successful_emails || 0,
            failed: progressData.failed_emails || 0
          });
          
          // If complete, clear interval and show success
          if (progressData.status === 'COMPLETED') {
            clearInterval(interval);
            setIsSending(false);
            toast.success(`Sent ${progressData.successful_emails} certificates successfully`);
            if (progressData.failed_emails > 0) {
              toast.error(`Failed to send ${progressData.failed_emails} emails`);
            }
            onClose();
          } else if (progressData.status === 'FAILED') {
            clearInterval(interval);
            setIsSending(false);
            setError(progressData.error_message || 'Batch email process failed');
            toast.error('Batch email process failed');
          }
        }
      } catch (error) {
        console.error('Error polling batch status:', error);
      }
    }, 1500);
    
    // Clean up interval after 5 minutes max
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (isSending) {
        setIsSending(false);
        toast.info('Email sending continues in the background');
        onClose();
      }
    }, 300000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [batchId, isSending, onClose]);

  const handleSendEmails = async () => {
    if (certificateIds.length === 0) {
      toast.error('No certificates selected for emails');
      return;
    }
    
    // Check if profile is loaded
    if (profileLoading) {
      toast.error('User profile is still loading. Please try again.');
      return;
    }
    
    // Check if profile exists
    if (!profile) {
      toast.error('Unable to access user profile. Please refresh and try again.');
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      
      // First, create a batch operation record to track progress
      const { data: batchOp, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          total_certificates: certificateIds.length,
          processed_certificates: 0,
          status: 'PENDING',
          successful_emails: 0,
          failed_emails: 0,
          user_id: profile?.id,
          batch_name: `Batch-${new Date().toISOString().substring(0, 19)}`
        })
        .select()
        .single();
        
      if (batchError) throw batchError;
      
      // Now call the Edge Function with batch ID
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchOp.id,
          userId: profile?.id
        }
      });
      
      if (error) throw error;
      
      setBatchId(batchOp.id);
      toast.success('Email sending process has started');
    } catch (error) {
      console.error('Error sending certificate emails:', error);
      setIsSending(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Failed to send emails: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm space-y-2">
        <p>Sending emails to {certificateIds.length} recipients</p>
        
        {certificatesWithoutPdf > 0 && (
          <div className="bg-amber-50 p-3 rounded text-amber-700 flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Warning</p>
              <p className="text-sm">{certificatesWithoutPdf} certificates don't have PDFs attached and recipients will receive emails without certificates.</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 p-3 rounded text-red-700">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isSending && progress.total > 0 && (
          <div className="space-y-2">
            <div className="bg-blue-50 p-3 rounded text-blue-700">
              <p className="mb-1">
                Processing: {progress.processed} of {progress.total} 
                ({Math.round((progress.processed / progress.total) * 100)}%)
              </p>
              <Progress value={(progress.processed / progress.total) * 100} className="h-2" />
            </div>
            
            {progress.success > 0 && (
              <p className="text-green-600 text-xs">✓ {progress.success} emails sent successfully</p>
            )}
            
            {progress.failed > 0 && (
              <p className="text-red-600 text-xs">✗ {progress.failed} emails failed to send</p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
          {isSending ? 'Close when done' : 'Cancel'}
        </Button>
        <Button 
          type="button" 
          className="gap-1" 
          onClick={handleSendEmails}
          disabled={isSending || profileLoading || !!profileError}
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
