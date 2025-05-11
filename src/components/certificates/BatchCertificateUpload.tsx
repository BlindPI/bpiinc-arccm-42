
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BatchUploadProvider } from './batch-upload/BatchCertificateContext';
import { BatchUploadForm } from './batch-upload/BatchUploadForm';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';

export function BatchCertificateUpload() {
  return (
    <BatchUploadProvider>
      <Card className="shadow-xl border-2 border-card card-gradient animate-fade-in w-full">
        <CardHeader>
          <CardTitle>
            <span className="text-gradient-primary">
              Roster Submission - Batch
            </span>
          </CardTitle>
          <CardDescription className="space-y-2">
            <p>Upload a roster file (XLSX) to process multiple certificate requests at once.</p>
            <div className="flex items-center gap-2 bg-white/60 dark:bg-muted/70 rounded-lg p-3 shadow-sm border border-muted/30">
              <span className="font-medium">Download template:</span>
              <TemplateDownloadOptions />
            </div>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <BatchUploadForm />
        </CardContent>
      </Card>
    </BatchUploadProvider>
  );
}
