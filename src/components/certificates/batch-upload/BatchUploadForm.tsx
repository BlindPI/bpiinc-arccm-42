
import React from 'react';
import { useBatchUpload } from './BatchCertificateContext';
import { FileDropZone } from '../FileDropZone';
import { BatchReviewSection } from './BatchReviewSection';
import { Loader2, FileSpreadsheet, CheckCircle } from 'lucide-react';

export function BatchUploadForm() {
  const { currentStep, isProcessingFile, processedData, processingStatus } = useBatchUpload();
  
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
    <div className="space-y-6">
      <FileDropZone />
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="font-medium mb-2 flex items-center">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          Batch Upload Tips
        </h4>
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
          <li>Use our template to ensure all required fields are included</li>
          <li>Each row should represent a single certificate recipient</li>
          <li>Make sure email addresses are valid to enable certificate delivery</li>
          <li>Course names will be matched to our system automatically</li>
          <li>Dates should be in YYYY-MM-DD format or MM/DD/YYYY format</li>
          <li>Batch process can handle up to 500 certificates at once</li>
        </ul>
      </div>
    </div>
  );
}
