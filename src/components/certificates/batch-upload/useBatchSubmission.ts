import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCourseData } from '@/hooks/useCourseData';

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
      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error)
        .map(row => {
          // Use course match if available
          let courseName = '';
          
          if (row.courseMatches && row.courseMatches.length > 0) {
            // Use the best match (first in the array)
            courseName = row.courseMatches[0].courseName;
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
            expiry_date: row.expiryDate || null,
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            status: 'PENDING', // Always set to PENDING so admins can review
            user_id: user.id,
            location_id: selectedLocationId !== 'none' ? selectedLocationId : null
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
                message: `A batch of ${successCount} certificate requests has been submitted by ${user.email} and is awaiting review.`,
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
            message: `A batch of ${successCount} certificate requests has been submitted and is awaiting review.`,
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