
import { Label } from '@/components/ui/label';
import { FileDropZone } from "../FileDropZone";

interface UploadSectionProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
  isUploading: boolean;
}

export function UploadSection({
  onFileSelected,
  disabled,
  isUploading
}: UploadSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Your Roster</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Start by uploading your roster file (CSV or XLSX). The system will automatically
          extract course information and dates when available.
        </p>
      </div>
      
      <FileDropZone
        onFileSelected={onFileSelected}
        disabled={disabled}
        isUploading={isUploading}
      />
      
      <p className="text-xs text-muted-foreground mt-2">
        {isUploading 
          ? 'Processing your roster...' 
          : 'Upload a CSV or XLSX file containing student data. The system will guide you through the next steps after processing your file.'}
      </p>
    </div>
  );
}
