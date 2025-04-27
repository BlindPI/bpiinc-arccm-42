import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCourseData } from '@/hooks/useCourseData';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { 
    processedData, 
    selectedCourseId, 
    selectedLocationId,
    extractedCourse,
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
    setCurrentStep('SUBMITTING');

    try {
      // Create certificate requests for each valid row
      const requests = processedData.data
        .filter(row => row.isProcessed && !row.error) // Only process rows without errors
        .map(row => {
          // Determine course name to use
          let courseName = '';
          
          // If a course ID is selected, use its name
          if (selectedCourseId !== 'none') {
            const selectedCourse = courses?.find(course => course.id === selectedCourseId);
            courseName = selectedCourse?.name || '';
          } 
          // Otherwise use extracted course name if available
          else if (extractedCourse?.name) {
            courseName = extractedCourse.name;
          }
          // Last resort: use the first aid level + CPR level if available
          else if (row.firstAidLevel) {
            courseName = `${row.firstAidLevel} ${row.cprLevel ? 'with ' + row.cprLevel : ''}`;
          }
          
          return {
            recipient_name: row.name,
            email: row.email,
            phone: row.phone || null,
            company: row.company || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            course_name: courseName, // Using course_name instead of course_id
            issue_date: row.issueDate,
            expiry_date: row.expiryDate || null,
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            status: 'PENDING',
            user_id: user.id,
            location_id: selectedLocationId !== 'none' ? selectedLocationId : null
          };
        });

      if (requests.length === 0) {
        toast.error('No valid records to submit');
        setIsSubmitting(false);
        return;
      }

      // Use a single transaction for all inserts
      const { data, error } = await supabase
        .from('certificate_requests')
        .insert(requests)
        .select('id');

      if (error) {
        throw error;
      }

      const successCount = data?.length || 0;
      
      toast.success(`Successfully submitted ${successCount} certificate requests`);
      
      // Send notification to admin about batch upload
      try {
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
      
      // Move to completion state
      setCurrentStep('COMPLETE');
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(`Error submitting batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setCurrentStep('REVIEW'); // Go back to review state on error
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBatch,
    isSubmitting
  };
}
