
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile } from './useProfile';
import { v4 as uuidv4 } from 'uuid';

// Import if not already in your project
// npm install uuid
// npm install --save-dev @types/uuid

export function useBatchSubmission() {
  const { data: profile } = useProfile();
  const [submittingRow, setSubmittingRow] = useState<number | null>(null);
  
  const submitBatch = useMutation({
    mutationFn: async ({ 
      rows, 
      courseId, 
      locationId,
      batchId: existingBatchId,
      batchName: existingBatchName
    }: { 
      rows: any[];
      courseId: string;
      locationId?: string;
      batchId?: string | null;
      batchName?: string | null;
    }) => {
      if (!profile) {
        throw new Error('User profile not found');
      }
      
      // Check if user has admin permissions
      if (!['SA', 'AD'].includes(profile.role)) {
        throw new Error('Only administrators can submit batch certificate requests');
      }
      
      // Generate batch ID and name if not provided
      const batchId = existingBatchId || uuidv4();
      const timestamp = new Date().toISOString();
      const defaultBatchName = `Batch Upload - ${new Date().toLocaleDateString()} - ${rows.length} certificates`;
      const batchName = existingBatchName || defaultBatchName;
      
      console.log(`Processing batch submission: ${batchId} - ${batchName}`);
      
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };
      
      // Process each row sequentially
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setSubmittingRow(i);
        
        try {
          console.log(`Processing row ${i+1}/${rows.length}:`, row);
          
          // Create certificate request
          const { data: request, error: requestError } = await supabase
            .from('certificate_requests')
            .insert({
              recipient_name: row.recipientName,
              course_name: courseId, // Will be replaced with actual course name
              user_id: profile.id,
              email: row.email || null,
              phone: row.phone || null,
              company: row.company || null,
              first_aid_level: row.firstAidLevel || null,
              cpr_level: row.cprLevel || null,
              assessment_status: row.assessmentStatus || 'PASS',
              issue_date: row.issueDate,
              expiry_date: row.expiryDate || null,
              city: row.city || null,
              province: row.province || null,
              postal_code: row.postalCode || null,
              status: 'PROCESSING', // Skip the approval step for admin batch upload
              // Fix: use null instead of empty string for location_id
              location_id: locationId && locationId !== 'none' ? locationId : null,
              batch_id: batchId,
              batch_name: batchName,
              reviewer_id: profile.id, // Auto-approve as admin
              length: row.length || null
            })
            .select()
            .single();
            
          if (requestError) {
            console.error(`Error creating request for row ${i+1}:`, requestError);
            results.failed++;
            results.errors.push(`Row ${i+1}: ${requestError.message}`);
            continue;
          }
          
          // Call edge function to generate certificate
          const { data: certResult, error: certError } = await supabase.functions
            .invoke('generate-certificate', {
              body: { 
                requestId: request.id,
                issuerId: profile.id,
                batchId: batchId,
                batchName: batchName
              }
            });
            
          if (certError || !certResult?.success) {
            console.error(`Error generating certificate for row ${i+1}:`, certError || certResult?.error);
            results.failed++;
            results.errors.push(`Row ${i+1}: ${(certError?.message || certResult?.message || 'Unknown error')}`);
          } else {
            results.success++;
            console.log(`Certificate created successfully for row ${i+1}:`, certResult);
          }
        } catch (error) {
          console.error(`Error processing row ${i+1}:`, error);
          results.failed++;
          results.errors.push(`Row ${i+1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
      
      setSubmittingRow(null);
      return { 
        ...results, 
        batchId, 
        batchName 
      };
    },
    onSuccess: (data) => {
      console.log('Batch processing completed:', data);
      
      if (data.failed > 0) {
        // Show mixed results toast
        toast.warning(
          `Batch partially processed: ${data.success} certificates created, ${data.failed} failed. See console for details.`,
          { duration: 5000 }
        );
      } else {
        // Show success toast
        toast.success(
          `${data.success} certificates successfully created in batch "${data.batchName}"`,
          { duration: 3000 }
        );
      }
    },
    onError: (error) => {
      console.error('Batch processing error:', error);
      toast.error(`Failed to process batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  return {
    submitBatch,
    isSubmitting: submitBatch.isPending,
    submittingRow,
    currentProgress: submittingRow !== null ? {
      current: submittingRow + 1,
      total: submitBatch.variables?.rows.length || 0
    } : null
  };
}
