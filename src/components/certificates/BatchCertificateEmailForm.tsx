
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, AlertCircle, RefreshCw, MailCheck, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

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
  const { authReady } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0, success: 0, failed: 0 });
  const [batchId, setBatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Get profile with proper auth-ready checking
  const profileQuery = useProfile();
  const profile = profileQuery?.data || null;
  
  // Early return if auth is not ready or profile is still loading
  if (!authReady || profileQuery?.isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading user profile...</span>
        </div>
      </div>
    );
  }
  
  // Check for certificates without PDFs
  const certificatesWithoutPdf = certificates.filter(cert => 
    !cert.certificate_url || cert.certificate_url.trim() === ''
  ).length;
  
  // Check for certificates already emailed
  const alreadyEmailedCerts = certificates.filter(cert => 
    cert.is_batch_emailed || cert.email_status === 'SENT'
  ).length;
  
  const isResendOperation = alreadyEmailedCerts > 0;
  
  // Calculate progress percentage
  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  
  // Enhanced polling with more frequent updates and better error handling
  useEffect(() => {
    if (!batchId || isComplete) return;
    
    console.log('Starting enhanced polling for batch ID:', batchId);
    
    let pollCount = 0;
    const maxPolls = 300; // 5 minutes at 1 second intervals
    
    const interval = setInterval(async () => {
      pollCount++;
      
      try {
        console.log(`Polling attempt ${pollCount}/${maxPolls} for batch:`, batchId);
        
        const { data: progressData, error } = await supabase
          .from('email_batch_operations')
          .select('processed_certificates, total_certificates, status, successful_emails, failed_emails, error_message, completed_at')
          .eq('id', batchId)
          .single();
          
        if (error) {
          console.error('Polling error:', error);
          return;
        }
          
        if (progressData) {
          console.log('Batch progress update:', progressData);
          
          const newProgress = {
            processed: progressData.processed_certificates || 0,
            total: progressData.total_certificates || certificateIds.length,
            success: progressData.successful_emails || 0,
            failed: progressData.failed_emails || 0
          };
          
          setProgress(newProgress);
          
          // Check for completion
          if (progressData.status === 'COMPLETED') {
            console.log('Batch completed successfully');
            clearInterval(interval);
            setIsSending(false);
            setIsComplete(true);
            
            if (progressData.failed_emails > 0) {
              setHasError(true);
              toast.error(`Completed with ${progressData.failed_emails} failed emails`);
            } else {
              toast.success(`Successfully sent ${progressData.successful_emails} certificates!`);
            }
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              onClose();
            }, 3000);
            
          } else if (progressData.status === 'FAILED') {
            console.log('Batch failed');
            clearInterval(interval);
            setIsSending(false);
            setIsComplete(true);
            setHasError(true);
            setError(progressData.error_message || 'Batch email process failed');
            toast.error('Batch email process failed');
            
          } else if (progressData.status === 'PROCESSING') {
            // Still processing, continue polling
            console.log(`Processing: ${newProgress.processed}/${newProgress.total}`);
          }
        }
      } catch (error) {
        console.error('Polling exception:', error);
      }
      
      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log('Polling timeout reached');
        clearInterval(interval);
        if (isSending) {
          setIsSending(false);
          toast.info('Email sending continues in the background');
          onClose();
        }
      }
    }, 1000); // Poll every second
    
    return () => {
      clearInterval(interval);
    };
  }, [batchId, isComplete, isSending, certificateIds.length, onClose]);

  const handleSendEmails = async () => {
    if (certificateIds.length === 0) {
      toast.error('No certificates selected for emails');
      return;
    }

    if (!profile) {
      toast.error('User profile not loaded. Please refresh the page and try again.');
      return;
    }
    
    try {
      setIsSending(true);
      setError(null);
      setHasError(false);
      setIsComplete(false);
      
      // Initialize progress immediately
      setProgress({
        processed: 0,
        total: certificateIds.length,
        success: 0,
        failed: 0
      });
      
      console.log('Creating batch operation for user:', profile.id);
      
      // Create batch operation record
      const { data: batchOp, error: batchError } = await supabase
        .from('email_batch_operations')
        .insert({
          total_certificates: certificateIds.length,
          processed_certificates: 0,
          status: 'PENDING',
          successful_emails: 0,
          failed_emails: 0,
          user_id: profile.id,
          batch_name: `${isResendOperation ? 'Resend-' : ''}Batch-${new Date().toISOString().substring(0, 19)}`
        })
        .select()
        .single();
        
      if (batchError) {
        console.error('Error creating batch operation:', batchError);
        throw batchError;
      }
      
      console.log('Batch operation created:', batchOp);
      setBatchId(batchOp.id);
      
      // Show immediate feedback
      toast.success(`Email ${isResendOperation ? 'resending' : 'sending'} process has started`);
      
      // Call the Edge Function
      console.log('Calling edge function with payload:', {
        certificateIds: certificateIds.length,
        batchId: batchOp.id,
        userId: profile.id
      });
      
      const { data, error } = await supabase.functions.invoke('send-batch-certificate-emails', {
        body: {
          certificateIds,
          batchId: batchOp.id,
          userId: profile.id
        }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }
      
      console.log('Edge function response:', data);
      
    } catch (error) {
      console.error('Error sending certificate emails:', error);
      setIsSending(false);
      setHasError(true);
      setIsComplete(true);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      toast.error(`Failed to send emails: ${errorMessage}`);
    }
  };

  // Render success state
  if (isComplete && !hasError) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-green-800">
              {isResendOperation ? 'Emails Resent Successfully!' : 'Emails Sent Successfully!'}
            </h3>
            <p className="text-green-600 font-medium">
              {progress.success} of {progress.total} certificates were sent successfully
            </p>
            {progress.failed > 0 && (
              <p className="text-orange-600 text-sm">
                {progress.failed} emails encountered issues
              </p>
            )}
          </div>
          
          <div className="w-full max-w-md">
            <div className="w-full bg-green-100 rounded-full h-3">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-1000"
                style={{ width: '100%' }}
              />
            </div>
            <p className="text-xs text-green-600 mt-2">Process Complete</p>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (isComplete && hasError) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-red-800">
              Email Process Failed
            </h3>
            <p className="text-red-600 font-medium">
              {progress.success > 0 
                ? `${progress.success} sent successfully, ${progress.failed} failed`
                : 'No emails were sent successfully'
              }
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Error Details:</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-center gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            onClick={() => { 
              setIsComplete(false); 
              setHasError(false); 
              setError(null); 
              setBatchId(null);
              setProgress({ processed: 0, total: 0, success: 0, failed: 0 });
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Render main form
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {isResendOperation ? 'Resend Certificate Emails' : 'Send Certificate Emails'}
          </h3>
          <Badge variant="secondary">
            {certificateIds.length} selected
          </Badge>
        </div>
        
        {certificatesWithoutPdf > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Certificates without PDFs
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  {certificatesWithoutPdf} of the selected certificates don't have PDF files yet. 
                  These will be sent as notification emails without download links.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {alreadyEmailedCerts > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MailCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Previously Emailed Certificates
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {alreadyEmailedCerts} of the selected certificates have been emailed before. 
                  This will be a resend operation.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {isSending && (
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="font-medium text-gray-900 mb-2">
              {isResendOperation ? 'Resending emails...' : 'Sending emails...'}
            </h4>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Processing {progress.processed} of {progress.total} certificates
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>{progress.success} sent successfully</span>
              <span>{progress.failed} failed</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isSending}>
          Cancel
        </Button>
        <Button onClick={handleSendEmails} disabled={isSending}>
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isResendOperation ? 'Resending...' : 'Sending...'}
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              {isResendOperation ? 'Resend Emails' : 'Send Emails'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
