
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { BatchUploadProvider } from './batch-upload/BatchCertificateContext';
import { BatchUploadForm } from './batch-upload/BatchUploadForm';
import { BatchReviewSection } from './batch-upload/BatchReviewSection';

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
          <CardDescription>
            Upload a roster file (XLSX) to process multiple certificate requests at once.<br />
            <span className="font-medium">Download our template below to ensure correct formatting:</span>
          </CardDescription>
          <div className="mt-2">
            <TemplateDownloadOptions
              templateType="roster"
              bucketName="roster-template"
              fileName="roster_template.xlsx"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <BatchUploadForm />
        </CardContent>
      </Card>
    </BatchUploadProvider>
  );
}
