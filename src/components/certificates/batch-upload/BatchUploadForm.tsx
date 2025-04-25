
import { useState, useEffect } from 'react';
import { FormFields } from './FormFields';
import { ValidationSection } from './ValidationSection';
import { UploadSection } from './UploadSection';
import { ProcessingStatus } from '../ProcessingStatus';
import { useBatchUpload } from './BatchCertificateContext';

interface BatchUploadFormProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function BatchUploadForm({ onFileUpload }: BatchUploadFormProps) {
  const {
    selectedCourseId,
    setSelectedCourseId,
    issueDate,
    setIssueDate,
    isValidated,
    setIsValidated,
    isUploading,
    processingStatus
  } = useBatchUpload();
  
  const [confirmations, setConfirmations] = useState([false, false, false, false]);

  useEffect(() => {
    setIsValidated(confirmations.every(Boolean));
  }, [confirmations, setIsValidated]);

  const handleFileSelected = async (file: File) => {
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  const isFormDisabled = isUploading || !selectedCourseId || !issueDate || !isValidated;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <FormFields
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          disabled={isUploading}
        />
        <ValidationSection
          confirmations={confirmations}
          setConfirmations={setConfirmations}
          setIsValidated={setIsValidated}
          disabled={isUploading}
        />
      </div>
      
      <UploadSection
        onFileSelected={handleFileSelected}
        disabled={isFormDisabled}
        isUploading={isUploading}
      />

      {processingStatus && (
        <div className="mt-2">
          <div className="border border-accent rounded-xl bg-accent/40 p-4 shadow custom-shadow animate-fade-in">
            <ProcessingStatus status={processingStatus} />
          </div>
        </div>
      )}
    </div>
  );
}
