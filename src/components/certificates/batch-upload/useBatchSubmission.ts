

import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { useAuth } from '@/hooks/useAuth';
import { createRoster, sendBatchRosterEmails } from '@/services/rosterService';
import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';
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
        record.isProcessed && 
        !record.error && 
        record.name && 
        record.email &&
        !record.hasCourseMismatch
      );

      if (validRecords.length === 0) {
        throw new Error('No valid records to submit');
      }

      console.log(`Submitting ${validRecords.length} valid records`);

      // Create roster data
      const rosterData = {
        location_id: selectedLocationId,
        created_by: user.id,
        status: 'PENDING' as const,
        total_certificates: validRecords.length,
        processed_certificates: 0,
        certificate_requests: validRecords.map(record => ({
          recipient_name: record.name,
          recipient_email: record.email,
          recipient_phone: record.phone || null,
          company: record.company || null,
          course_id: record.courseMatches?.[0]?.courseId || null,
          course_name: record.courseMatches?.[0]?.courseName || 'Unknown Course',
          issue_date: record.issueDate,
          expiry_date: record.expiryDate,
          assessment_status: record.assessmentStatus || 'PASS',
          certifications: record.certifications || {},
          instructor_name: record.instructorName || null,
          instructor_level: record.instructorLevel || null,
          notes: record.notes || null,
          city: record.city || null,
          province: record.province || null,
          postal_code: record.postalCode || null
        }))
      };

      console.log('Creating roster with data:', { 
        location_id: rosterData.location_id,
        created_by: rosterData.created_by,
        total_certificates: rosterData.total_certificates
      });

      // Create the roster
      const rosterResult = await createRoster(rosterData);
      
      if (!rosterResult.success) {
        throw new Error(rosterResult.error?.message || 'Failed to create roster');
      }

      const rosterId = rosterResult.data.id;
      console.log('Roster created successfully:', rosterId);

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
