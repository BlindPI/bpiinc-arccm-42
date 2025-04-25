
import { FormFields } from './FormFields';
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
    selectedCourseId,
    setSelectedCourseId,
    issueDate,
    setIssueDate,
    isValidated,
    setIsValidated,
    isUploading,
    processingStatus,
    processedData,
    enableCourseMatching,
    setEnableCourseMatching
  } = useBatchUpload();

  return (
    <div className="space-y-6">
      {/* Step 1: File Upload Section */}
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl px-4 py-6 shadow-sm animate-fade-in">
        <UploadSection
          onFileSelected={onFileUpload}
          disabled={isUploading}
          isUploading={isUploading}
        />
      </div>

      {/* Step 2: Only show validation and form fields after data is processed */}
      {processedData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <FormFields
              selectedCourseId={selectedCourseId}
              setSelectedCourseId={setSelectedCourseId}
              issueDate={issueDate}
              setIssueDate={setIssueDate}
              enableCourseMatching={enableCourseMatching}
              setEnableCourseMatching={setEnableCourseMatching}
              disabled={isUploading}
            />
            <ValidationSection
              confirmations={[false, false, false, false]}
              setConfirmations={() => {}}
              setIsValidated={setIsValidated}
              disabled={isUploading}
            />
          </div>

          <div className="border border-accent rounded-xl bg-accent/40 p-4 shadow custom-shadow animate-fade-in">
            <RosterReview 
              data={processedData.data}
              totalCount={processedData.totalCount}
              errorCount={processedData.errorCount}
              enableCourseMatching={enableCourseMatching}
            />
          </div>
        </>
      )}

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
