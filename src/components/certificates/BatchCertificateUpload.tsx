
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchUploadForm } from './batch-upload/BatchUploadForm';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { ProcessingStatus } from './ProcessingStatus';
import { BatchUploadProvider, useBatchUpload } from './batch-upload/BatchCertificateContext';
import { useBatchUploadHandler } from './batch-upload/useBatchUploadHandler';
import { RosterReview } from './RosterReview';
import { BatchSubmitSection } from './batch-upload/BatchSubmitSection';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

function BatchUploadContent() {
  const { 
    processingStatus, 
    processedData, 
    isReviewMode, 
    setIsReviewMode, 
    isSubmitting, 
    enableCourseMatching,
    isValidated,
    selectedCourseId,
    extractedCourse,
    hasCourseMatches
  } = useBatchUpload();
  const { processFileContents, submitProcessedData } = useBatchUploadHandler();

  useEffect(() => {
    if (processingStatus && processingStatus.processed === processingStatus.total) {
      const message = `Processing complete. ${processingStatus.successful} successful, ${processingStatus.failed} failed.`;
      if (processingStatus.failed > 0) {
        toast.error(message);
      } else {
        toast.success(message);
      }
    }
  }, [processingStatus]);

  // If we've uploaded and processed data, show the review mode
  useEffect(() => {
    if (processedData && processedData.data.length > 0) {
      setIsReviewMode(true);
    }
  }, [processedData, setIsReviewMode]);

  // Log for debugging
  useEffect(() => {
    console.log('BatchCertificateUpload state:', {
      hasProcessedData: !!processedData,
      isReviewMode,
      selectedCourseId,
      extractedCourseId: extractedCourse?.id,
      hasCourseMatches
    });
  }, [processedData, isReviewMode, selectedCourseId, extractedCourse, hasCourseMatches]);

  const handleBackToUpload = () => {
    setIsReviewMode(false);
  };

  // Check if we have course information to enable submit button
  const hasCourse = Boolean(selectedCourseId || (extractedCourse && extractedCourse.id)) || hasCourseMatches;
  const isSubmitDisabled = !processedData || !hasCourse || !isValidated || processedData.data.length === 0;

  return (
    <div className="space-y-6">
      {isReviewMode ? (
        <>
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={handleBackToUpload}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Upload
            </Button>
          </div>
          
          {processedData && (
            <div className="border border-accent rounded-xl bg-accent/20 p-4 shadow custom-shadow animate-fade-in">
              <RosterReview 
                data={processedData.data}
                totalCount={processedData.totalCount}
                errorCount={processedData.errorCount}
                enableCourseMatching={enableCourseMatching}
              />
            </div>
          )}
          
          <BatchSubmitSection 
            onSubmit={submitProcessedData}
            isSubmitting={isSubmitting}
            hasErrors={processedData?.errorCount && processedData.errorCount > 0}
            disabled={isSubmitDisabled}
          />
        </>
      ) : (
        <div className="p-0 sm:p-2 rounded-xl bg-muted/40 card-gradient">
          <BatchUploadForm onFileUpload={processFileContents} />
        </div>
      )}

      {processingStatus && !isReviewMode && (
        <div className="border border-accent rounded-xl bg-accent/40 p-4 shadow custom-shadow animate-fade-in">
          <ProcessingStatus status={processingStatus} />
        </div>
      )}
    </div>
  );
}

export function BatchCertificateUpload() {
  return (
    <BatchUploadProvider>
      <Card className="shadow-xl border-2 border-card card-gradient animate-fade-in">
        <CardHeader>
          <CardTitle>
            <span className="text-gradient-primary">
              Roster Submission - Batch
            </span>
          </CardTitle>
          <CardDescription>
            Upload a roster file (XLSX or CSV) to process multiple certificate requests at once.<br />
            <span className="font-medium">Download one of our templates below to ensure correct formatting:</span>
          </CardDescription>
          <div className="mt-2">
            <TemplateDownloadOptions />
          </div>
        </CardHeader>
        
        <CardContent>
          <BatchUploadContent />
        </CardContent>
      </Card>
    </BatchUploadProvider>
  );
}
