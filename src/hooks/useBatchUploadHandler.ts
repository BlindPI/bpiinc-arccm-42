
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useBatchUpload } from '@/components/certificates/batch-upload/BatchCertificateContext';

export function useBatchUploadHandler() {
  const {
    processedData,
    selectedCourseId,
    selectedLocationId,
    issueDate,
    rosterName,
    rosterDescription,
    setCurrentStep
  } = useBatchUpload();
  const [progress, setProgress] = useState(0);

  // Mutation for batch submission
  const submitBatch = useMutation({
    mutationFn: async () => {
      if (!processedData || !processedData.data.length || !selectedCourseId || !rosterName) {
        throw new Error('Missing required data for submission');
      }

      setProgress(0);
      
      try {
        // 1. First, create the roster
        const { data: rosterData, error: rosterError } = await supabase
          .from('rosters')
          .insert({
            name: rosterName,
            description: rosterDescription || null,
            course_id: selectedCourseId,
            location_id: selectedLocationId || null,
            issue_date: issueDate,
            created_by: (await supabase.auth.getUser()).data.user?.id,
            status: 'ACTIVE'
          })
          .select()
          .single();
        
        if (rosterError) {
          console.error('Error creating roster:', rosterError);
          throw new Error('Failed to create roster: ' + rosterError.message);
        }

        console.log('Created roster:', rosterData);
        const rosterId = rosterData.id;

        // 2. Create certificate requests for each record
        const batchSize = 20;  // Process in batches of 20
        const totalRecords = processedData.data.length;
        
        for (let i = 0; i < totalRecords; i += batchSize) {
          const batch = processedData.data.slice(i, i + batchSize);
          const requests = batch.map(record => ({
            recipient_name: record.name,
            email: record.email,
            phone: record.phone || null,
            company: record.company || null,
            city: record.city || null,
            province: record.province || null,
            postal_code: record.postalCode || null,
            first_aid_level: record.firstAidLevel || null,
            cpr_level: record.cprLevel || null,
            course_name: record.courseName || courses.find(c => c.id === selectedCourseId)?.name || 'Unknown Course',
            issue_date: record.issueDate || issueDate,
            expiry_date: record.expiryDate || null,
            instructor_name: record.instructorName || null,
            location_id: selectedLocationId || null,
            status: 'PENDING',
            batch_id: rosterId,
            batch_name: rosterName
          }));
          
          const { error: batchError } = await supabase
            .from('certificate_requests')
            .insert(requests);
          
          if (batchError) {
            console.error('Error submitting batch:', batchError);
            throw new Error('Failed to submit certificate requests: ' + batchError.message);
          }
          
          // Update progress
          setProgress(Math.min(100, Math.round(((i + batch.length) / totalRecords) * 100)));
        }
        
        return { rosterId, recordCount: totalRecords };
      } catch (error) {
        console.error('Error in batch submission:', error);
        throw error;
      }
    },
    onSuccess: ({ rosterId, recordCount }) => {
      console.log('Batch submitted successfully');
      toast.success(`Successfully submitted ${recordCount} certificate requests`);
      setCurrentStep('COMPLETE');
    },
    onError: (error: Error) => {
      console.error('Error submitting batch:', error);
      toast.error(`Failed to submit batch: ${error.message}`);
      setProgress(0);
    }
  });

  return {
    submitBatch: submitBatch.mutate,
    isSubmitting: submitBatch.isPending,
    progress,
    error: submitBatch.error
  };
}
