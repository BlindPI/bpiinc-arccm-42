

import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { useAuth } from '@/hooks/useAuth';
import { createRoster, sendBatchRosterEmails } from '@/services/rosterService';
import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const {
    processedData,
    selectedLocationId,
    setCurrentStep,
    setIsSubmitting: setContextSubmitting
  } = useBatchUpload();

  const submitBatch = async () => {
    if (!processedData || !selectedLocationId || !user) {
      toast.error('Missing required data for submission');
      return;
    }

    setIsSubmitting(true);
    setContextSubmitting(true);
    setCurrentStep('SUBMITTING');

    try {
      console.log('Starting batch submission process...');

      // Filter out invalid records
      const validRecords = processedData.data.filter(record => 
        record.validationErrors.length === 0 && 
        record.recipientName && 
        record.email &&
        !record.hasCourseMismatch
      );

      if (validRecords.length === 0) {
        throw new Error('No valid records to submit');
      }

      console.log(`Submitting ${validRecords.length} valid records`);

      // Create roster data with valid fields only
      const rosterData = {
        name: `Batch-${new Date().toISOString().slice(0, 10)}-${validRecords.length}`,
        location_id: selectedLocationId,
        created_by: user.id,
        status: 'PENDING' as const,
        certificate_count: validRecords.length,
        course_id: validRecords[0]?.courseMatches?.[0]?.courseId || null,
        issue_date: validRecords[0]?.issueDate || new Date().toISOString().slice(0, 10),
        description: `Batch certificate request with ${validRecords.length} certificates`,
        instructor_name: validRecords[0]?.instructorName || null
      };

      console.log('Creating roster with data:', { 
        location_id: rosterData.location_id,
        created_by: rosterData.created_by,
        certificate_count: rosterData.certificate_count
      });

      // Create the roster
      const rosterResult = await createRoster(rosterData);
      
      if (!rosterResult.success) {
        throw new Error(rosterResult.error?.message || 'Failed to create roster');
      }

      const rosterId = rosterResult.data.id;
      console.log('Roster created successfully:', rosterId);

      // Create certificate requests separately and link to roster
      const batchId = crypto.randomUUID();
      const batchName = rosterData.name;
      
      console.log('Creating certificate requests...');
      for (const record of validRecords) {
        try {
          const { data: certificateRequest, error } = await supabase
            .from('certificate_requests')
            .insert({
              roster_id: rosterId,
              batch_id: batchId,
              batch_name: batchName,
              user_id: user.id,
              location_id: selectedLocationId,
              recipient_name: record.recipientName,
              recipient_email: record.email,
              email: record.email,
              phone: record.phone || null,
              company: record.company || null,
              course_name: record.courseMatches?.[0]?.courseName || 'Unknown Course',
              issue_date: record.issueDate,
              expiry_date: record.expiryDate,
              assessment_status: record.assessmentStatus || 'PASS',
              cpr_level: record.cprLevel || null,
              first_aid_level: record.firstAidLevel || null,
              instructor_name: record.instructorName || null,
              instructor_level: record.instructorLevel || null,
              notes: record.notes || null,
              city: record.city || null,
              province: record.province || null,
              postal_code: record.postalCode || null,
              status: 'PENDING'
            });

          if (error) {
            console.error('Failed to create certificate request:', error);
            throw new Error(`Failed to create certificate request: ${error.message}`);
          }
        } catch (requestError) {
          console.error('Certificate request creation failed:', requestError);
          throw requestError;
        }
      }
      
      console.log(`Successfully created ${validRecords.length} certificate requests`);

      // Try to send notifications (but don't fail if this doesn't work)
      try {
        console.log('Attempting to send notifications...');
        
        // Notify the submitter
        await SimpleCertificateNotificationService.notifyBatchSubmitted(
          user.id,
          rosterId,
          validRecords.length
        );
        console.log('Submitter notification sent successfully');

        // Notify administrators - with error handling
        await SimpleCertificateNotificationService.notifyAdminsOfBatchSubmission(
          rosterId,
          user.email || user.id,
          validRecords.length
        );
        console.log('Admin notifications sent successfully');

      } catch (notificationError) {
        console.error('Notification sending failed, but continuing with batch submission:', notificationError);
        // Don't fail the entire submission just because notifications failed
      }

      // Try to send batch emails (but don't fail if this doesn't work)
      try {
        console.log('Attempting to send batch emails...');
        const recipientEmails = validRecords.map(record => record.email);
        
        const emailResult = await sendBatchRosterEmails(rosterId, recipientEmails);
        
        if (emailResult.success) {
          console.log('Batch emails sent successfully');
        } else {
          console.warn('Batch email sending failed:', emailResult.error);
          // Don't fail the submission - emails can be sent later
        }
      } catch (emailError) {
        console.error('Email sending failed, but continuing with batch submission:', emailError);
        // Don't fail the entire submission just because emails failed
      }

      // Success!
      console.log('Batch submission completed successfully');
      toast.success(`Successfully submitted ${validRecords.length} certificate requests!`);
      setCurrentStep('COMPLETE');

    } catch (error) {
      console.error('Batch submission failed:', error);
      toast.error(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('REVIEW'); // Go back to review step on error
    } finally {
      setIsSubmitting(false);
      setContextSubmitting(false);
    }
  };

  return {
    submitBatch,
    isSubmitting
  };
}
