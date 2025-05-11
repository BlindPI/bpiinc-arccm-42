
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { BatchSubmissionResult } from '@/types/batch-upload';

export function useBatchSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<BatchSubmissionResult | null>(null);
  
  const { 
    setCurrentStep, 
    processedData,
    selectedCourseId,
    batchName
  } = useBatchUpload();
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

  const submitBatch = async () => {
    if (isSubmitting) {
      toast.error("Already processing a submission");
      return;
    }
    
    if (!profile?.id) {
      toast.error("You must be logged in to submit certificates");
      return;
    }
    
    if (!processedData?.data || processedData.data.length === 0) {
      toast.error("No data to submit");
      return;
    }
    
    setIsSubmitting(true);
    setCurrentStep('SUBMITTING');
    
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
          recipient_email: row.email,
          course_name: row.courseName || "Course",
          issue_date: row.issueDate || new Date().toISOString().slice(0, 10),
          expiry_date: row.expiryDate || null,
          status: "ACTIVE",
          user_id: profile.id,
          batch_id: batchResult.id,
          verification_code: verificationCode
        };
      }));
      
      // Insert the certificates
      const { error: certError } = await supabase
        .from('certificates')
        .insert(certificates);
      
      if (certError) {
        throw certError;
      }
      
      // Set the result
      const result: BatchSubmissionResult = {
        success: true,
        batchId: batchResult.id,
        batchName: batchResult.name,
        certificatesCount: validRows.length,
        message: `Successfully submitted ${validRows.length} certificates`
      };
      
      setSubmissionResult(result);
      toast.success(`Successfully submitted ${validRows.length} certificates`);
      
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
    }
  };
  
  return {
    submitBatch,
    isSubmitting,
    submissionResult
  };
}
