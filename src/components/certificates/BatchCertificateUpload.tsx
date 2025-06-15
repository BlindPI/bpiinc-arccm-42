
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TemplateDownloadOptions } from './TemplateDownloadOptions';
import { BatchUploadForm } from './BatchUploadForm';
import { useState } from 'react';
import { ProcessingStatus } from '@/types/batch-upload';

export function BatchCertificateUpload() {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isValidated, setIsValidated] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);

  // Calculate expiry date based on issue date (default to 3 years)
  const calculateExpiryDate = (issueDate: string) => {
    const issue = new Date(issueDate);
    const expiry = new Date(issue);
    expiry.setFullYear(expiry.getFullYear() + 3);
    return expiry.toISOString().split('T')[0];
  };

  const expiryDate = issueDate ? calculateExpiryDate(issueDate) : '';

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setProcessingStatus({
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    });

    try {
      // File processing logic would go here
      console.log('Processing file:', file.name);
      
      // Reset processing status after completion
      setTimeout(() => {
        setIsUploading(false);
        setProcessingStatus(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setIsUploading(false);
      setProcessingStatus(null);
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
