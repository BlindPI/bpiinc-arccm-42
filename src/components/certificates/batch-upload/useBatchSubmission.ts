
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function useBatchSubmission() {
  const { 
    processedData, 
    selectedCourseId, 
    selectedLocationId, 
    setCurrentStep,
    setIsSubmitting,
    batchId,
    batchName
  } = useBatchUpload();
  const queryClient = useQueryClient();
  const [submissionErrors, setSubmissionErrors] = useState<string[]>([]);

  const submitBatch = async () => {
    if (!processedData || processedData.data.length === 0) {
      toast.error('No data to submit');
      return;
    }
    
    // Start submitting
    setIsSubmitting(true);
    setCurrentStep('SUBMITTING');
    setSubmissionErrors([]);
    
    try {
      const validRows = processedData.data.filter(row => row.isProcessed && !row.error);
      
      if (validRows.length === 0) {
        throw new Error('No valid rows to submit');
      }
      
      // Get the current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      const userId = userData.user?.id;
      
      if (!userId) {
        throw new Error('User ID not available');
      }
      
      // Determine which course ID to use
      const getCourseIdForRow = (row: any) => {
        if (row.courseMatches && row.courseMatches.length > 0) {
          return row.courseMatches[0].courseId;
        }
        return selectedCourseId !== 'none' ? selectedCourseId : null;
      };
      
      // Create certificate requests
      const { data: insertedData, error: insertError } = await supabase
        .from('certificate_requests')
        .insert(
          validRows.map(row => ({
            recipient_name: row.name,
            email: row.email,
            course_name: row.courseMatches && row.courseMatches.length > 0
              ? row.courseMatches[0].courseName
              : row.course_name || 'Unspecified Course',
            issue_date: row.issueDate,
            expiry_date: row.expiryDate,
            phone: row.phone || null,
            company: row.company || null,
            city: row.city || null,
            province: row.province || null,
            postal_code: row.postalCode || null,
            first_aid_level: row.firstAidLevel || null,
            cpr_level: row.cprLevel || null,
            assessment_status: row.assessmentStatus || 'PASS',
            status: 'PENDING',
            user_id: userId,
            // Fix: use null instead of empty string for location_id
            location_id: selectedLocationId && selectedLocationId !== 'none' ? selectedLocationId : null,
            batch_id: batchId,
            batch_name: batchName
          }))
        )
        .select();
      
      if (insertError) {
        throw new Error(`Error creating certificate requests: ${insertError.message}`);
      }
      
      // Success
      toast.success(`Successfully submitted ${validRows.length} certificate requests`);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['certificateRequests'] });
      
      // Move to complete step
      setCurrentStep('COMPLETE');
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to submit batch'}`);
      setCurrentStep('REVIEW');
      
      if (error instanceof Error) {
        setSubmissionErrors([error.message]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitBatch,
    submissionErrors,
    isSubmitting: false // This is controlled by context
  };
}
