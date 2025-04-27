
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BatchUploadForm } from './batch-upload/BatchUploadForm';
import { BatchSubmitSection } from './batch-upload/BatchSubmitSection';
import { BatchCertificateProvider, useBatchUpload } from './batch-upload/BatchCertificateContext';
import { useBatchUploadHandler } from './batch-upload/useBatchUploadHandler';
import { toast } from 'sonner';

function BatchUploadContent() {
  const { 
    isUploading, 
    isSubmitting, 
    processedData, 
    setProcessedData, 
    setProcessingStatus,
    setIsSubmitting,
    setValidationErrors,
    setIsValidated
  } = useBatchUpload();
  
  const { processFileContents, submitProcessedData } = useBatchUploadHandler();

  const handleSubmit = async () => {
    try {
      await submitProcessedData();
      
      // Show success message
      toast.success("Batch upload completed successfully!");
      
      // Wait for 2 seconds before resetting the form
      setTimeout(() => {
        // Reset all form state
        setProcessedData(null);
        setProcessingStatus(null);
        setIsSubmitting(false);
        setValidationErrors([]);
        setIsValidated(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting batch:', error);
      toast.error('Failed to submit batch');
      setIsSubmitting(false);
    }
  };

  const hasErrors = processedData?.errorCount && processedData.errorCount > 0;

  return (
    <Card className="bg-white">
      <CardContent className="p-6">
        <div className="space-y-6">
          <BatchUploadForm onFileUpload={processFileContents} />
          
          {processedData && (
            <BatchSubmitSection
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              hasErrors={hasErrors}
              disabled={isUploading}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function BatchCertificateUpload() {
  return (
    <BatchCertificateProvider>
      <BatchUploadContent />
    </BatchCertificateProvider>
  );
}
