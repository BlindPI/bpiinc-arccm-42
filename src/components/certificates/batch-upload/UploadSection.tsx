
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
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
    <div className="bg-white/70 dark:bg-secondary/70 border border-card rounded-xl px-4 py-6 shadow-sm flex flex-col gap-3 items-stretch animate-fade-in">
      <Label htmlFor="file" className="mb-2">Upload Roster (CSV or XLSX)</Label>
      <FileDropZone
        onFileSelected={onFileSelected}
        disabled={disabled}
        isUploading={isUploading}
      />
      <div className="w-full flex flex-row-reverse mt-2">
        <Button
          variant="default"
          size="lg"
          className="w-auto"
          disabled={disabled}
          onClick={() => {
            if (!disabled && document.querySelector('input[type=file]')) {
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
  );
}
