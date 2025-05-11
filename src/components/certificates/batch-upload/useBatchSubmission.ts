
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { BatchSubmissionResult } from '@/types/batch-upload';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<BatchSubmissionResult | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  // Get context inside functions, not at the module level
  const { data: profile } = useProfile();

  /**
   * Generate verification codes for the certificates
   */
  const generateVerificationCode = async (): Promise<string> => {
    try {
      // Call the PostgreSQL function to generate a verification code
      const { data, error } = await supabase.rpc('generate_verification_code');
      
      if (error) throw error;
      return data;
    } catch (error) {
      // Fallback method if the RPC fails
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      let code = '';
      
      // Generate first 3 characters (letters)
      for (let i = 0; i < 3; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Generate middle 5 characters (numbers)
      for (let i = 0; i < 5; i++) {
        code += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
      
      // Generate last 2 characters (letters)
      for (let i = 0; i < 2; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      return code;
    }
  };

  /**
   * Process certificates in batches to avoid timeouts and provide progress feedback
   */
  const processCertificateBatch = async (certificates: any[], batchId: string) => {
    const batchSize = 25;
    const totalBatches = Math.ceil(certificates.length / batchSize);
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, certificates.length);
      const currentBatch = certificates.slice(start, end);
      
      try {
        // Insert the certificates
        const { error } = await supabase
          .from('certificates')
          .insert(currentBatch);
        
        if (error) {
          console.error(`Error inserting batch ${i+1}/${totalBatches}:`, error);
          errorCount += currentBatch.length;
          throw error;
        }
        
        successCount += currentBatch.length;
        
        // Update progress
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        setProcessingProgress(progress);
        
      } catch (error) {
        console.error(`Error processing batch ${i+1}:`, error);
        // Continue with the next batch instead of failing completely
        toast.error(`Error in batch ${i+1}. Continuing with next batch.`);
      }
    }
    
    return { successCount, errorCount };
  };

  const submitBatch = async (): Promise<BatchSubmissionResult> => {
    // Get context inside the function to avoid circular dependency
    const { 
      setCurrentStep, 
      processedData,
      selectedCourseId,
      batchName 
    } = useBatchUpload();
    
    if (isSubmitting) {
      const error = "Already processing a submission";
      toast.error(error);
      return {
        success: false,
        errors: [error],
        message: error
      };
    }
    
    if (!profile?.id) {
      const error = "You must be logged in to submit certificates";
      toast.error(error);
      return {
        success: false,
        errors: [error],
        message: error
      };
    }
    
    if (!processedData?.data || processedData.data.length === 0) {
      const error = "No data to submit";
      toast.error(error);
      return {
        success: false,
        errors: [error],
        message: error
      };
    }
    
    setIsSubmitting(true);
    setCurrentStep('SUBMITTING');
    setProcessingProgress(0);
    
    try {
      // Filter out rows with errors
      const validRows = processedData.data.filter(row => !row.error);
      
      if (validRows.length === 0) {
        throw new Error("No valid records to submit");
      }
      
      // Prepare the batch data
      const batchData = {
        name: batchName || `Batch ${new Date().toISOString().slice(0, 10)}`,
        created_by: profile.id,
        certificate_count: validRows.length,
        course_id: selectedCourseId !== 'none' ? selectedCourseId : null
      };
      
      // Create the batch
      const { data: batchResult, error: batchError } = await supabase
        .from('certificate_batches')
        .insert(batchData)
        .select('*')
        .single();
      
      if (batchError) {
        throw batchError;
      }
      
      if (!batchResult) {
        throw new Error("Failed to create batch record");
      }
      
      // Transform the data for certificate creation
      const certificates = await Promise.all(validRows.map(async row => {
        const verificationCode = await generateVerificationCode();
        return {
          recipient_name: row.name,
          recipient_email: row.email, // Now using the recipient_email field
          course_name: row.courseName || "Course",
          issue_date: row.issueDate || new Date().toISOString().slice(0, 10),
          expiry_date: row.expiryDate || null,
          status: "ACTIVE",
          user_id: profile.id,
          batch_id: batchResult.id,
          verification_code: verificationCode
        };
      }));
      
      // Process certificates in smaller batches with progress updates
      const { successCount, errorCount } = await processCertificateBatch(certificates, batchResult.id);
      
      // Set the result
      const result: BatchSubmissionResult = {
        success: successCount > 0,
        batchId: batchResult.id,
        batchName: batchResult.name,
        certificatesCount: successCount,
        errors: errorCount > 0 ? [`${errorCount} certificates failed to process`] : undefined,
        message: `Successfully submitted ${successCount} certificates${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
      };
      
      setSubmissionResult(result);
      
      if (successCount > 0) {
        toast.success(`Successfully submitted ${successCount} certificates`);
      }
      
      if (errorCount > 0) {
        toast.warning(`${errorCount} certificates failed to process`);
      }
      
      // Move to the completion step
      setCurrentStep('COMPLETE');
      
      return result;
      
    } catch (error) {
      console.error("Error submitting batch:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      const result: BatchSubmissionResult = {
        success: false,
        errors: [errorMessage],
        message: `Error submitting batch: ${errorMessage}`
      };
      
      setSubmissionResult(result);
      toast.error(`Error submitting batch: ${errorMessage}`);
      
      // Go back to review step on error
      setCurrentStep('REVIEW');
      
      return result;
      
    } finally {
      setIsSubmitting(false);
      setProcessingProgress(0);
    }
  };
  
  return {
    submitBatch,
    isSubmitting,
    submissionResult,
    processingProgress
  };
}
