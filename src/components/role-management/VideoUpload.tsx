
import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoUploadProps {
  transitionRequestId: string;
  videoIndex: number;
  onUploadSuccess?: () => void;
}

export function VideoUpload({ transitionRequestId, videoIndex, onUploadSuccess }: VideoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('video/')) {
        setFile(selectedFile);
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a video file first');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${transitionRequestId}_video${videoIndex}_${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${transitionRequestId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('audit_videos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: submissionError } = await supabase
        .from('role_video_submissions')
        .insert({
          video_url: filePath,
          // We'll link this submission back to an audit submission later if needed
        });

      if (submissionError) throw submissionError;

      toast.success('Video uploaded successfully');
      setFile(null);
      onUploadSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video {videoIndex + 1}</CardTitle>
        <CardDescription>Upload the required video for this role transition request</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor={`video-${videoIndex}`}>Video File</Label>
            <Input
              id={`video-${videoIndex}`}
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full sm:w-auto"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
