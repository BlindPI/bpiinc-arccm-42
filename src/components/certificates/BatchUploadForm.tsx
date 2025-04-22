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
      <div className="space-y-4">
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
          />
        </div>

        <BatchValidationChecklist
          confirmations={confirmations}
          setConfirmations={setConfirmations}
          setIsValidated={setIsValidated}
          disabled={isUploading}
        />

        <div>
          <Label htmlFor="file">Upload Roster (CSV or XLSX)</Label>
          <div className="mt-2">
            <FileDropZone
              onFileSelected={handleFileSelected}
              disabled={isUploading || !selectedCourseId || !issueDate || !isValidated}
              isUploading={isUploading}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isUploading ? 'Uploading and processing roster...' : 'Upload a CSV or XLSX file containing student data'}
          </p>
        </div>

        {processingStatus && <ProcessingStatus status={processingStatus} />}
      </div>
    </div>
  );
}
