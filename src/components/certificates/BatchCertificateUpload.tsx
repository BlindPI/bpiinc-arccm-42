
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { BatchUploadForm } from './BatchUploadForm';
import { ProcessingStatus as ProcessingStatusType } from './types';

export function BatchCertificateUpload() {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType | null>(null);

  // Calculate expiry date based on issue date and selected course
  const expiryDate = issueDate ? new Date(new Date(issueDate).setFullYear(new Date(issueDate).getFullYear() + 2)).toISOString().split('T')[0] : '';

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // File processing logic will be handled by BatchUploadForm
      console.log('Processing file:', file.name);
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
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
          <TemplateDownloadOptions />
        </div>
      </CardHeader>
      
      <CardContent>
        <BatchUploadForm
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          issueDate={issueDate}
          setIssueDate={setIssueDate}
          isValidated={isValidated}
          setIsValidated={setIsValidated}
          expiryDate={expiryDate}
          isUploading={isUploading}
          processingStatus={processingStatus}
          onFileUpload={handleFileUpload}
        />
      </CardContent>
    </Card>
  );
}
