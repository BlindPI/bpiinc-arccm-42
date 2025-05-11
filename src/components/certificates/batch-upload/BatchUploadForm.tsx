
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function BatchUploadForm() {
  const { 
    currentStep, 
    setCurrentStep, 
    isProcessingFile,
    resetForm
  } = useBatchUpload();
  
  const { processFile } = useFileProcessor();
  const { submitBatch, isSubmitting } = useBatchSubmission();
  
  const handleFileUpload = async (file: File) => {
    await processFile(file);
    // Move to review step if successful
    setCurrentStep('REVIEW');
  };
  
  const handleBackToUpload = () => {
    // This won't cause a full reset, just go back to the upload view
    setCurrentStep('UPLOAD');
  };

  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-6 px-4 py-2">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'UPLOAD' ? 'bg-primary text-white' : 'bg-primary/20 text-primary'}`}>
            1
          </div>
          <div className={`h-0.5 w-6 ${currentStep !== 'UPLOAD' ? 'bg-primary' : 'bg-gray-300'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'REVIEW' ? 'bg-primary text-white' : currentStep === 'SUBMITTING' || currentStep === 'COMPLETE' ? 'bg-primary/20 text-primary' : 'bg-gray-200'}`}>
            2
          </div>
          <div className={`h-0.5 w-6 ${currentStep === 'SUBMITTING' || currentStep === 'COMPLETE' ? 'bg-primary' : 'bg-gray-300'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'COMPLETE' ? 'bg-primary text-white' : 'bg-gray-200'}`}>
            3
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {renderStepIndicator()}
      
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
        <Card className="border-primary/20 shadow-md">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <h3 className="text-xl font-semibold">Submitting Certificates...</h3>
              <p className="text-muted-foreground">
                Please wait while we process your batch submission
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Show completion state */}
      {currentStep === 'COMPLETE' && <BatchSubmitSuccess />}
    </div>
  );
}
