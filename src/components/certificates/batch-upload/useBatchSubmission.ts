
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBatchUpload } from './BatchCertificateContext';
import { useProfile } from '@/hooks/useProfile';
import { generateRosterId } from '@/types/batch-upload';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  
  const {
    processedData,
    selectedLocationId,
    setCurrentStep,
    resetForm
  } = useBatchUpload();

  const submitBatch = async () => {
    if (!processedData || !selectedLocationId || !profile) {
      throw new Error('Missing required data for batch submission');
    }

    setIsSubmitting(true);
    setCurrentStep('SUBMITTING');

    try {
      console.log('Starting batch submission process...');

      // Generate human-readable roster name
      const rosterName = `Roster ${generateRosterId(profile.display_name || 'Unknown')}`;

      console.log(`Submitting batch: ${rosterName}`);

      // Call the edge function to handle all server-side processing
      const { data, error } = await supabase.functions.invoke('process-batch-upload', {
        body: {
          processedData,
          selectedLocationId,
          rosterName,
          submittedBy: profile.id
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Batch submission failed');
      }

      console.log('Batch submission completed successfully:', data);

      // Update UI state
      setCurrentStep('COMPLETE');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['certificate-requests'] });
      queryClient.invalidateQueries({ queryKey: ['rosters'] });

      toast.success(`Batch submitted successfully! ${data.validRecordsProcessed} records processed.`);

    } catch (error) {
      console.error('Batch submission failed:', error);
      toast.error(`Batch submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('REVIEW'); // Go back to review step
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMutation = useMutation({
    mutationFn: submitBatch,
    onSuccess: () => {
      console.log('Batch submission mutation completed successfully');
    },
    onError: (error: any) => {
      console.error('Batch submission mutation error:', error);
    }
  });

  return {
    submitBatch: submitMutation.mutate,
    isSubmitting: isSubmitting || submitMutation.isPending
  };
}
