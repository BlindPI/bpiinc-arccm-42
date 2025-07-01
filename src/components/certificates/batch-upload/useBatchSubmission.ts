
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBatchUpload } from './BatchCertificateContext';
import { useProfile } from '@/hooks/useProfile';
import { generateRosterId } from '@/types/batch-upload';
import { createRoster } from '@/services/rosterService';

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

      // Filter out records with validation errors for submission
      const validRecords = processedData.data.filter(row => 
        row.validationErrors.length === 0 && !row.hasCourseMismatch
      );

      console.log(`Submitting ${validRecords.length} valid records out of ${processedData.totalCount} total`);

      // Create roster entry - let database generate UUID for id
      const rosterData = {
        name: rosterName,
        location_id: selectedLocationId,
        submitted_by: profile.id,
        total_count: validRecords.length,
        status: 'SUBMITTED' as const,
        submitted_at: new Date().toISOString()
      };

      const { success: rosterSuccess, data: rosterResult, error: rosterError } = await createRoster(rosterData);

      if (!rosterSuccess || rosterError || !rosterResult) {
        throw new Error(`Failed to create roster: ${rosterError?.message || 'Unknown error'}`);
      }

      // Use the database-generated UUID for roster_id
      const rosterUUID = rosterResult.id;

      // Create certificate requests for valid records
      const certificateRequests = validRecords.map(row => ({
        user_id: profile.id,
        recipient_name: row.recipientName,
        recipient_email: row.email,
        recipient_phone: row.phone || null,
        company: row.company || null,
        course_name: row.courseMatch?.name || row.courseName || 'Unknown Course',
        course_id: row.courseMatch?.id || null,
        location_id: selectedLocationId,
        roster_id: rosterUUID, // Use the database-generated UUID
        batch_id: rosterName, // Keep human-readable for batch_id
        batch_name: rosterName,
        status: 'PENDING' as const,
        assessment_status: row.assessmentStatus === 'PASS' ? 'PASS' : 'FAIL',
        certifications: row.courseMatch?.certifications || [],
        course_length: row.courseMatch?.length || null,
        expiration_months: row.courseMatch?.expiration_months || 24,
        issue_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + (row.courseMatch?.expiration_months || 24) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }));

      // Insert certificate requests in batches
      const batchSize = 50;
      const insertPromises = [];

      for (let i = 0; i < certificateRequests.length; i += batchSize) {
        const batch = certificateRequests.slice(i, i + batchSize);
        insertPromises.push(
          supabase
            .from('certificate_requests')
            .insert(batch)
        );
      }

      const results = await Promise.all(insertPromises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        console.error('Some certificate requests failed to insert:', errors);
        throw new Error(`Failed to insert ${errors.length} certificate requests`);
      }

      console.log('Certificate requests inserted successfully');

      // CRITICAL: Trigger automatic email notification to AP users
      try {
        console.log('Triggering batch email notification...');
        
        const emailResult = await supabase.functions.invoke('batch-request-email-details', {
          body: {
            rosterId: rosterUUID, // Use the database-generated UUID
            locationId: selectedLocationId,
            submittedBy: profile.id,
            rosterData: processedData.data, // Send all data including errors for AP review
            batchName: rosterName
          }
        });

        if (emailResult.error) {
          console.error('Failed to send batch notification emails:', emailResult.error);
          // Don't fail the submission, just log the email error
          toast.warning('Batch submitted successfully, but notification emails failed to send');
        } else {
          console.log('Batch notification emails sent successfully:', emailResult.data);
          toast.success(`Batch submitted successfully! Notification emails sent to AP users.`);
        }
      } catch (emailError) {
        console.error('Error triggering batch email notification:', emailError);
        toast.warning('Batch submitted successfully, but notification emails failed to send');
      }

      // Update UI state
      setCurrentStep('COMPLETE');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['certificate-requests'] });
      queryClient.invalidateQueries({ queryKey: ['rosters'] });

      console.log('Batch submission completed successfully');

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
      toast.success('Batch submission completed successfully!');
    },
    onError: (error: any) => {
      console.error('Batch submission mutation error:', error);
      toast.error(`Submission failed: ${error.message}`);
    }
  });

  return {
    submitBatch: submitMutation.mutate,
    isSubmitting: isSubmitting || submitMutation.isPending
  };
}
