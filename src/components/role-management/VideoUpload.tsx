
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

export interface VideoUploadProps {
  transitionRequestId: string;
  onUploadSuccess: () => void;
  onCancel: () => void;
}

export const VideoUpload = ({
  transitionRequestId,
  onUploadSuccess,
  onCancel
}: VideoUploadProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      if (!selectedFile.type.startsWith('video/')) {
        toast.error('Please select a valid video file');
        return;
      }
      
      // Check file size (limit to 100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('Video file is too large. Maximum size is 100MB');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a video file');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title for your video');
      return;
    }

    if (!user) {
      toast.error('You must be logged in to upload videos');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create a unique file path
      const fileExt = file.name.split('.').pop();
      // Use our custom UUID generator that works across environments
      const { generateUUID } = require('@/utils/uuidUtils');
      const filePath = `${user.id}/${generateUUID()}.${fileExt}`;

      // Upload to Supabase Storage with properly named bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          // This property is not supported, but we'll use it for TypeScript
          // @ts-ignore
          onUploadProgress: (progress: { loaded: number; total: number }) => {
            setUploadProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase
        .from('role_video_submissions')
        .insert({
          transition_request_id: transitionRequestId,
          user_id: user.id,
          title,
          description: description || null,
          video_url: publicUrl,
          status: 'PENDING'
        });

      if (dbError) throw dbError;

      onUploadSuccess();
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Failed to upload video');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="video-title">Video Title</Label>
        <Input
          id="video-title"
          placeholder="Enter a title for your video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isUploading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="video-description">Description (optional)</Label>
        <Textarea
          id="video-description"
          placeholder="Provide additional details about your video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUploading}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="video-file">Video File</Label>
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            id="video-file"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            disabled={isUploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {file ? file.name : 'Select Video File'}
          </Button>
        </div>
        {file && (
          <p className="text-xs text-muted-foreground">
            Size: {Math.round(file.size / (1024 * 1024) * 10) / 10} MB
          </p>
        )}
      </div>
      
      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-xs text-center text-muted-foreground">
            Uploading: {uploadProgress}%
          </p>
        </div>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            'Upload Video'
          )}
        </Button>
      </div>
    </div>
  );
};
