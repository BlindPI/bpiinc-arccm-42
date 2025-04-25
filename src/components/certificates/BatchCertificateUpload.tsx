
import { useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchUploadForm } from './batch-upload/BatchUploadForm';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { ProcessingStatus } from './ProcessingStatus';
import { BatchUploadProvider, useBatchUpload } from './batch-upload/BatchCertificateContext';
import { useBatchUploadHandler } from './batch-upload/useBatchUploadHandler';

function BatchUploadContent() {
  const { processingStatus, processedData } = useBatchUpload();
  const { processFileContents } = useBatchUploadHandler();

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

  return (
    <div className="space-y-6">
      <div className="p-0 sm:p-2 rounded-xl bg-muted/40 card-gradient">
        <BatchUploadForm onFileUpload={processFileContents} />
      </div>
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
