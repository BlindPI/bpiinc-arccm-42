
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface VideoUploadProps {
  transitionRequestId?: string;
  onUploadSuccess: () => void;
  title: string;
  description?: string;
}

export function VideoUpload({ 
  transitionRequestId,
  onUploadSuccess,
  title,
  description 
}: VideoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type - only accept video files
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      // Validate file size - 100MB max for videos
      if (file.size > 100 * 1024 * 1024) {
        toast.error('Video file should be less than 100MB');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 1. Upload the file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile, {
          onUploadProgress: (progress) => {
            setUploadProgress((progress.loaded / progress.total) * 100);
          }
        });
      
      if (uploadError) throw uploadError;
      
      // 2. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);
      
      // 3. Create a record in the role_video_submissions table
      const { error: submissionError } = await supabase
        .from('role_video_submissions')
        .insert({
          user_id: user.id,
          transition_request_id: transitionRequestId,
          title: title,
          description: description || null,
          video_url: publicUrl,
          status: 'PENDING',
          submitted_at: new Date().toISOString()
        });
      
      if (submissionError) throw submissionError;
      
      // 4. Success!
      setSelectedFile(null);
      onUploadSuccess();
      toast.success('Video uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div className="space-y-2">
          <input
            type="file"
            accept="video/*"
            id="video-upload"
            className="hidden"
            onChange={handleFileChange}
          />
          <label
            htmlFor="video-upload"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 p-6 text-center"
          >
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-sm text-gray-500">
              Click to select a video file (max 100MB)
            </span>
          </label>
        </div>
      ) : (
        <div className="rounded-md border p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium truncate max-w-[180px]">
              {selectedFile.name}
            </span>
            {!isUploading && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0" 
                onClick={handleCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(uploadProgress)}%
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <Button
                variant="default"
                className="w-full"
                onClick={handleUpload}
              >
                Upload Video
              </Button>
            </div>
          )}
        </div>
      )}
      
      {isUploading && (
        <div className="flex justify-center">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
