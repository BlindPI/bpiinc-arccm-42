import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { CourseSelector } from './CourseSelector';
import { ValidationChecklist } from './ValidationChecklist';
import { ProcessingStatus } from './ProcessingStatus';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { ProcessingStatus as ProcessingStatusType } from './types';
import { BatchValidationChecklist } from "./BatchValidationChecklist";
import { FileDropZone } from "./FileDropZone";

interface BatchUploadFormProps {
  selectedCourseId: string;
  setSelectedCourseId: (id: string) => void;
  issueDate: string;
  setIssueDate: (date: string) => void;
  isValidated: boolean;
  setIsValidated: (validated: boolean) => void;
  expiryDate: string;
  isUploading: boolean;
  processingStatus: ProcessingStatusType | null;
  onFileUpload: (file: File) => Promise<void>;
}

export function BatchUploadForm({
  selectedCourseId,
  setSelectedCourseId,
  issueDate,
  setIssueDate,
  isValidated,
  setIsValidated,
  expiryDate,
  isUploading,
  processingStatus,
  onFileUpload
}: BatchUploadFormProps) {
  const [confirmations, setConfirmations] = useState([false, false, false, false]);

  useEffect(() => {
    setIsValidated(confirmations.every(Boolean));
  }, [confirmations, setIsValidated]);

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().match(/\.(csv|xlsx)$/)) {
      toast.error('Please upload a CSV or XLSX file');
      return;
    }
    try {
      await onFileUpload(file);
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="flex flex-col space-y-4">
          <CourseSelector 
            selectedCourseId={selectedCourseId} 
            onCourseSelect={setSelectedCourseId} 
          />
          <div>
            <Label htmlFor="issueDate">Issue Date</Label>
            <Input 
              id="issueDate" 
              type="date" 
              value={issueDate} 
              onChange={e => setIssueDate(e.target.value)} 
              required 
              placeholder="yyyy-mm-dd"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <div className="bg-white/60 dark:bg-muted/70 rounded-lg shadow border border-muted/70 p-4">
            <BatchValidationChecklist
              confirmations={confirmations}
              setConfirmations={setConfirmations}
              setIsValidated={setIsValidated}
              disabled={isUploading}
            />
          </div>
        </div>
      </div>
      <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl px-4 py-6 shadow-sm flex flex-col gap-3 items-stretch animate-fade-in">
        <Label htmlFor="file" className="mb-2">Upload Roster (CSV or XLSX)</Label>
        <FileDropZone
          onFileSelected={handleFileSelected}
          disabled={isUploading || !selectedCourseId || !issueDate || !isValidated}
          isUploading={isUploading}
        />
        <div className="w-full flex flex-row-reverse mt-2">
          <Button
            variant="default"
            size="lg"
            className="w-auto"
            disabled={isUploading || !selectedCourseId || !issueDate || !isValidated}
            onClick={() => {
              if (!isUploading && document.querySelector('input[type=file]')) {
                (document.querySelector('input[type=file]') as HTMLInputElement).click();
              }
            }}
          >
            <Upload className="w-5 h-5" />
            Upload Roster
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isUploading ? 'Uploading and processing roster...' : 'Upload a CSV or XLSX file containing student data'}
        </p>
      </div>
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
