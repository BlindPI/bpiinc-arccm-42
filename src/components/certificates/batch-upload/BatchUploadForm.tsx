
import { useState } from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { FileUploadSection } from './FileUploadSection';
import { BatchReviewSection } from './BatchReviewSection';
import { BatchSubmitSuccess } from './BatchSubmitSuccess';
import { useFileProcessor } from './useFileProcessor';
import { useBatchSubmission } from './useBatchSubmission';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function BatchUploadForm() {
  const { 
    currentStep, 
    setCurrentStep, 
    isProcessingFile,
    selectedCourseId,
    processedData
  } = useBatchUpload();
  
  const { processFile } = useFileProcessor();
  const { submitBatch, isSubmitting, submissionResult } = useBatchSubmission();
  
  // Mock batch data for when we reach the success state 
  // (ideally this should be populated from actual submission results)
  const batchData = {
    courseName: processedData?.data?.[0]?.courseName || "Course",
    batchName: submissionResult?.batchName || "Batch Upload",
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: ""
  };
  
  // Transform processed data into the format expected by BatchSubmitSuccess
  const processedCertificates = processedData?.data?.map(item => ({
    success: !item.error,
    name: item.name,
    email: item.email,
    error: item.error
  })) || [];
  
  const handleFileUpload = async (file: File) => {
    await processFile(file);
  };
  
  const handleBackToUpload = () => {
    // This won't cause a full reset, just go back to the upload view
    setCurrentStep('UPLOAD');
  };

  // Each step gets its own distinct component for better separation
  return (
    <div className="space-y-6 w-full">
      {/* Show upload screen */}
      {currentStep === 'UPLOAD' && (
        <FileUploadSection onFileUpload={handleFileUpload} />
      )}
      
      {/* Show review & submit screen */}
      {currentStep === 'REVIEW' && (
        <>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handleBackToUpload}
              className="mb-4"
              disabled={isProcessingFile || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
            </Button>
          </div>
          
          <BatchReviewSection />
        </>
      )}
      
      {/* Show submitting state */}
      {currentStep === 'SUBMITTING' && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <h3 className="text-xl font-semibold">Submitting Certificates...</h3>
          <p className="text-muted-foreground">
            Please wait while we process your batch submission
          </p>
        </div>
      )}
      
      {/* Show completion state */}
      {currentStep === 'COMPLETE' && (
        <BatchSubmitSuccess 
          batchData={batchData}
          processedCertificates={processedCertificates}
        />
      )}
    </div>
  );
}
