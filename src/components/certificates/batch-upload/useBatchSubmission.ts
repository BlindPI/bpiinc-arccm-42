
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
        // Send notification to administrators
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'CERTIFICATE_REQUEST',
            title: 'Batch Certificate Request',
            message: `A batch of ${successCount} certificate requests has been submitted and is awaiting review.`
          }
        });
      } catch (notificationError) {
        console.error('Error sending batch notification:', notificationError);
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
