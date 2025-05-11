
import { useState } from 'react';
import { FileDropZone } from '../FileDropZone';
import { useBatchUpload } from './BatchCertificateContext';
import { Loader2, UploadCloud } from 'lucide-react';
import { SelectCourseSection } from './SelectCourseSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function FileUploadSection({ onFileUpload }: FileUploadSectionProps) {
  const { isProcessingFile } = useBatchUpload();

  const handleUpload = async (file: File) => {
    await onFileUpload(file);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-primary" />
            Upload Roster File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-3">
            <p className="text-sm text-muted-foreground mb-3">
              Upload your roster file (XLSX) containing student information. The system will guide you through the next steps.
            </p>
            
            <FileDropZone 
              onFileSelected={handleUpload} 
              isUploading={isProcessingFile} 
              disabled={isProcessingFile}
            />
            
            {isProcessingFile && (
              <div className="flex items-center justify-center mt-4 gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Processing your file...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <SelectCourseSection />
    </div>
  );
}
