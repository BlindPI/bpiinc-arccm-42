
import { useState } from 'react';
import { ValidationSection } from './ValidationSection';
import { UploadSection } from './UploadSection';
import { ProcessingStatus } from '../ProcessingStatus';
import { RosterReview } from '../RosterReview';
import { useBatchUpload } from './BatchCertificateContext';

interface BatchUploadFormProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function BatchUploadForm({ onFileUpload }: BatchUploadFormProps) {
  const {
    isValidated,
    setIsValidated,
    isUploading,
    processingStatus,
    processedData,
    enableCourseMatching,
    extractedCourse
  } = useBatchUpload();

  // State for validation checklist - updated to 5 items based on the new BatchValidationChecklist
  const [confirmations, setConfirmations] = useState([false, false, false, false, false]);

  // Handle validation state changes
  const handleValidationChange = (newConfirmations: boolean[]) => {
    setConfirmations(newConfirmations);
    setIsValidated(newConfirmations.every(Boolean));
  };

  return (
    <div className="space-y-6 w-full">
      {/* Step 1: File Upload Section */}
      <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 shadow-sm transition-all hover:shadow-md w-full">
        <UploadSection
          onFileSelected={onFileUpload}
          disabled={isUploading}
          isUploading={isUploading}
        />
      </div>

      {/* Step 2: Always show validation section */}
      <div className="w-full">
        <ValidationSection
          confirmations={confirmations}
          setConfirmations={handleValidationChange}
          setIsValidated={setIsValidated}
          disabled={isUploading}
        />
      </div>

      {/* Step 3: Show roster review if data is processed */}
      {processedData && (
        <div className="border border-primary/20 rounded-xl bg-primary/5 p-5 shadow-sm animate-fade-in w-full">
          <RosterReview 
            data={processedData.data}
            totalCount={processedData.totalCount}
            errorCount={processedData.errorCount}
            enableCourseMatching={enableCourseMatching}
          />
        </div>
      )}

      {processingStatus && (
        <div className="mt-2 w-full">
          <div className="border border-primary/20 rounded-xl bg-primary/5 p-5 shadow-sm animate-fade-in">
            <ProcessingStatus status={processingStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
