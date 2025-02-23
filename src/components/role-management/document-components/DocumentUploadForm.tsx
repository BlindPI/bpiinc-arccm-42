
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';

interface DocumentUploadFormProps {
  submissionId: string;
  onUpload: (requirementId: string, file: File) => Promise<void>;
  requirementId: string;
}

export const DocumentUploadForm = ({ submissionId, onUpload, requirementId }: DocumentUploadFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(requirementId, file);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`file-${submissionId}`}>Upload New Version</Label>
      <div className="flex gap-2">
        <Input
          id={`file-${submissionId}`}
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          accept=".pdf,.doc,.docx"
          className="flex-1"
        />
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="ml-2">Upload</span>
        </Button>
      </div>
    </div>
  );
};
