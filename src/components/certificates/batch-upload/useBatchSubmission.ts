
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';
import { addMonths, format } from 'date-fns';
import { generateRosterId } from '@/types/batch-upload';
import { createRoster } from '@/services/rosterService';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    processedData, 
    selectedLocationId, 
    setCurrentStep 
  } = useBatchUpload();
  const { user } = useAuth();
  const { data: courses } = useCourseData();

  // Get all admin users to notify them of batch uploads
  const getAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email')
        .in('role', ['SA', 'AD']);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admin users:', error);
      return [];
    }
  };

  // Helper function to calculate expiry date when missing
  const calculateExpiryDate = (issueDate: string, courseId: string | undefined) => {
    try {
      if (!issueDate) return null;
      
      // Find course to get expiration months
      let expirationMonths = 24; // Default to 24 months if not specified
      if (courseId && courses) {
        const selectedCourse = courses.find(c => c.id === courseId);
        if (selectedCourse?.expiration_months) {
          expirationMonths = selectedCourse.expiration_months;
        }
      }
      
      // Parse the issue date and add expiration months
      const parsedIssueDate = new Date(issueDate);
      if (isNaN(parsedIssueDate.getTime())) {
        return format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd');
      }
      
      const expiryDate = addMonths(parsedIssueDate, expirationMonths);
      return format(expiryDate, 'yyyy-MM-dd');
    } catch (e) {
      console.error('Error calculating expiry date:', e);
      // Return a default expiry date of 2 years from today as a fallback
      return format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd');
    }
  };

  const submitBatch = async () => {
    if (isSubmitting) {
      toast.error('Already submitting batch');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to submit certificates');
      return;
    }

    if (!processedData || processedData.data.length === 0) {
      toast.error('No data to submit');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting batch submission...');

    try {
      // Generate a unique batch ID and a human-readable roster ID
      const batchId = crypto.randomUUID();
      
      // Get user display name for the roster ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();

      // Create a roster ID using the user's display name or email if name not available
      const userName = profile?.display_name || user.email?.split('@')[0] || 'USER';
      const rosterName = generateRosterId(userName);
      
      console.log(`Generated roster ID: ${rosterName} for batch ${batchId}`);

      // Determine course information for the roster
      let courseId = undefined;
      let courseName = '';
      
      // Extract course information from the first successful match or the first row
      const firstValidRow = processedData.data.find(row => row.isProcessed && !row.error);
      if (firstValidRow) {
        if (firstValidRow.courseMatches && firstValidRow.courseMatches.length > 0) {
          courseName = firstValidRow.courseMatches[0].courseName;
          courseId = firstValidRow.courseMatches[0].courseId;
        }
      }
      
      // Create a roster record first
      const { success, data: rosterData, error: rosterError } = await createRoster({
        name: rosterName,
        description: `Batch upload from ${userName} on ${format(new Date(), 'PPP')}`,
        created_by: user.id,
        location_id: selectedLocationId !== 'none' ? selectedLocationId : null,
        course_id: courseId,
        issue_date: firstValidRow?.issueDate || format(new Date(), 'yyyy-MM-dd'),
        status: 'ACTIVE',
        certificate_count: processedData.data.filter(row => row.isProcessed && !row.error).length
      });
      
      if (!success || rosterError) {
        console.error('Failed to create roster:', rosterError);
        toast.error(`Failed to create roster: ${rosterError?.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Created roster record:', rosterData);
      
      const rosterId = rosterData?.id;

      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error)
        .map(row => {
          // Use course match if available
          let courseName = '';
          let courseId = undefined;
          
          if (row.courseMatches && row.courseMatches.length > 0) {
            // Use the best match (first in the array)
            courseName = row.courseMatches[0].courseName;
            courseId = row.courseMatches[0].courseId;
          }
          
          // Ensure expiry date is set - this is critical to prevent DB errors
          const expiryDate = row.expiryDate || calculateExpiryDate(row.issueDate, courseId);
          
          if (!expiryDate) {
            console.warn(`No expiry date could be calculated for ${row.name}, using default 2-year expiration`);
          }
          
          return {
            recipient_name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            course_name: courseName, // This is what's actually stored in the DB
            issue_date: row.issueDate,
            expiry_date: expiryDate || format(new Date(new Date().setFullYear(new Date().getFullYear() + 2)), 'yyyy-MM-dd'),
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            instructor_name: row.instructorName || null,
            instructor_level: row.instructorLevel || null,
            status: 'PENDING', // Always set to PENDING so admins can review
            user_id: user.id,
            location_id: selectedLocationId !== 'none' ? selectedLocationId : null,
            batch_id: batchId,       // Store the batch UUID
            batch_name: rosterName,  // Store the human-readable roster ID
            roster_id: rosterId      // Store the roster ID for proper grouping
          };
        });

      if (requests.length === 0) {
        toast.error('No valid records to submit');
        setIsSubmitting(false);
        return;
      }

      console.log('Submitting certificate requests:', requests);

      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests)
        .select('id');

      if (error) {
        throw error;
      }

      const successCount = data?.length || 0;
      
      toast.success(`Successfully submitted ${successCount} certificate requests for review`);
      
      try {
        // Get all admin users to notify them
        const adminUsers = await getAdminUsers();
        
        console.log(`Sending notifications to ${adminUsers.length} administrators`);
        
        // Send notification to each administrator individually
        for (const admin of adminUsers) {
          try {
            await supabase.functions.invoke('send-notification', {
              body: {
                userId: admin.id,
                type: 'CERTIFICATE_REQUEST',
                title: 'Batch Certificate Request',
                message: `A batch of ${successCount} certificate requests has been submitted by ${user.email} and is awaiting review. Roster ID: ${rosterName}`,
                priority: 'HIGH',
                category: 'CERTIFICATE'
              }
            });
            console.log(`Notification sent to admin: ${admin.email}`);
          } catch (notificationError) {
            console.error(`Error sending notification to admin ${admin.email}:`, notificationError);
          }
        }

        // Also send a system-level notification
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            title: 'Batch Certificate Request',
            message: `A batch of ${successCount} certificate requests has been submitted and is awaiting review. Roster ID: ${rosterName}`,
            priority: 'HIGH',
            category: 'CERTIFICATE'
          }
        });
        
      } catch (notificationError) {
        console.error('Error sending batch notifications:', notificationError);
        // Don't fail the process if notifications have issues
      }

      // Change step to complete
      setCurrentStep('COMPLETE');
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(`Error submitting batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitBatch, isSubmitting };
}
