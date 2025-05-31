
import { useState } from 'react';
import { FileDropZone } from '../FileDropZone';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useBatchUpload } from './BatchCertificateContext';

interface FileUploadSectionProps {
  onFileUpload: (file: File) => Promise<void>;
}

export function FileUploadSection({ onFileUpload }: FileUploadSectionProps) {
  const { 
    enableCourseMatching, 
    setEnableCourseMatching,
    isProcessingFile
  } = useBatchUpload();

  const handleUpload = async (file: File) => {
    await onFileUpload(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl px-6 py-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Upload Your Roster</h3>
          <p className="text-sm text-muted-foreground">
            Start by uploading your roster file (XLSX). The system will automatically
            extract course information and dates when available.
          </p>
        </div>
        
        <FileDropZone 
          onFileSelected={handleUpload} 
          isUploading={isProcessingFile} 
          disabled={isProcessingFile}
        />
        
        <p className="text-xs text-muted-foreground mt-3">
          {isProcessingFile 
            ? 'Processing your roster...' 
            : 'Upload a CSV or XLSX file containing student data. The system will guide you through the next steps after processing your file.'}
        </p>
      </div>
      
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-2">
          <Switch
            id="course-matching"
            checked={enableCourseMatching}
            onCheckedChange={setEnableCourseMatching}
            disabled={isProcessingFile}
          />
          <Label htmlFor="course-matching">
            Enable automatic course matching
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          When enabled, the system will try to match First Aid Level, CPR Level, and Course Length in your roster with available courses.
        </p>
      </div>
    </div>
  );
}
