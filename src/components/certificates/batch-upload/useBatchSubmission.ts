

import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { createRoster, sendBatchRosterEmails } from '@/services/rosterService';
import { SimpleCertificateNotificationService } from '@/services/notifications/simpleCertificateNotificationService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  
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
        record.name &&
        record.email &&
        !record.hasCourseMismatch
      );

      if (validRecords.length === 0) {
        throw new Error('No valid records to submit');
      }

      console.log(`Submitting ${validRecords.length} valid records`);

      // Generate human-readable batch name like JW-20250702-1828-76 from user's actual name
      const now = new Date();
      
      // Get initials from user's profile name
      let userInitials = 'XX';
      if (profile?.display_name) {
        const nameParts = profile.display_name.trim().split(' ');
        if (nameParts.length >= 2) {
          // Take first letter of first name and first letter of last name
          userInitials = (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
        } else if (nameParts.length === 1) {
          // Single name, take first two letters
          userInitials = nameParts[0].substring(0, 2).toUpperCase();
        }
      } else if (user.email) {
        // Fallback to email if no display name
        userInitials = user.email.substring(0, 2).toUpperCase();
      }
      
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
      const timeStr = now.toTimeString().slice(0, 5).replace(':', '');
      const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      const humanReadableBatchName = `${userInitials}-${dateStr}-${timeStr}-${randomSuffix}`;

      // Create roster data with valid fields only
      const rosterData = {
        name: humanReadableBatchName,
        location_id: selectedLocationId,
        created_by: user.id,
        status: 'PENDING' as const,
        certificate_count: validRecords.length,
        course_id: validRecords[0]?.courseMatches?.[0]?.id || null,
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
          // Determine status based on assessment result
          const assessmentStatus = record.assessmentStatus || 'PASS';
          const recordStatus = assessmentStatus.toUpperCase() === 'FAIL' ? 'ARCHIVED' : 'PENDING';
          
          const { data: certificateRequest, error } = await supabase
            .from('certificate_requests')
            .insert({
              roster_id: rosterId,
              batch_id: batchId,
              batch_name: batchName,
              user_id: user.id,
              location_id: selectedLocationId,
              recipient_name: record.name,
              recipient_email: record.email,
              email: record.email,
              phone: record.phone || null,
              company: record.company || null,
              course_name: record.courseMatches?.[0]?.name || 'Unknown Course',
              issue_date: record.issueDate,
              expiry_date: record.expiryDate,
              assessment_status: assessmentStatus,
              cpr_level: record.cprLevel || null,
              first_aid_level: record.firstAidLevel || null,
              instructor_name: record.instructorName || null,
              instructor_level: record.instructorLevel || null,
              notes: record.notes || null,
              city: record.city || null,
              province: record.province || null,
              postal_code: record.postalCode || null,
              status: recordStatus
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

      // Log activity to team lifecycle events
      try {
        // Find user's team based on location assignment
        const { data: userLocationAssignment } = await supabase
          .from('ap_user_location_assignments')
          .select('location_id')
          .eq('ap_user_id', user.id)
          .eq('status', 'active')
          .single();

        if (userLocationAssignment) {
          // Find team at this location
          const { data: teamAtLocation } = await supabase
            .from('teams')
            .select('id')
            .eq('location_id', userLocationAssignment.location_id)
            .single();

          if (teamAtLocation) {
            await supabase
              .from('team_lifecycle_events')
              .insert({
                team_id: teamAtLocation.id,
                event_type: 'batch_upload_submitted',
                event_data: {
                  batch_id: batchId,
                  batch_name: humanReadableBatchName,
                  roster_id: rosterId,
                  certificate_count: validRecords.length,
                  course_name: validRecords[0]?.courseMatches?.[0]?.name || 'Unknown Course',
                  location_id: selectedLocationId
                },
                performed_by: user.id,
                event_timestamp: new Date().toISOString()
              });
          }
        }
      } catch (activityError) {
        console.error('Failed to log team activity, but continuing:', activityError);
      }

      // Update roster status to PROCESSED after successful completion
      try {
        await supabase
          .from('rosters')
          .update({ status: 'PROCESSED' })
          .eq('id', rosterId);
        console.log('Roster status updated to PROCESSED');
      } catch (statusError) {
        console.error('Failed to update roster status, but continuing:', statusError);
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
