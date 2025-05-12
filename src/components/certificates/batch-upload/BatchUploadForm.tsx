
import React from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { BatchReviewSection } from './BatchReviewSection';
import { Loader2 } from 'lucide-react';
import { UploadSection } from './UploadSection';

export function BatchUploadForm() {
  const { 
    currentStep, 
    isProcessingFile, 
    processedData, 
    processingStatus, 
    handleFileProcessing,
    isValidated
  } = useBatchUpload();
  
  // Display the loading state when processing a file
  if (isProcessingFile) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
        <h3 className="mt-4 text-xl font-semibold">Processing File</h3>
        <p className="text-gray-500 mt-1">Please wait while we analyze your data</p>
        
        {processingStatus && (
          <div className="mt-6 w-full max-w-md">
            <div className="flex justify-between text-sm mb-1">
              <span>Processing rows...</span>
              <span>{processingStatus.processed} of {processingStatus.total}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${Math.round((processingStatus.processed / processingStatus.total) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Show the review step if we have processed data and are on the REVIEW or later step
  if ((currentStep === 'REVIEW' || currentStep === 'SUBMITTING' || currentStep === 'COMPLETE') && processedData) {
    return <BatchReviewSection />;
  }
  
  // Default to the upload step
  return (
    <UploadSection 
      onFileSelected={handleFileProcessing}
      disabled={!isValidated} 
      isUploading={isProcessingFile}
    />
  );
}
