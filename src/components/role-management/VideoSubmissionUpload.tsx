
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2, Video, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VideoSubmissionUploadProps {
  transitionRequestId: string;
  requiredCount: number;
  onUploadSuccess?: () => void;
}

export function VideoSubmissionUpload({ 
  transitionRequestId, 
  requiredCount,
  onUploadSuccess 
}: VideoSubmissionUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const videoFiles = files.filter(file => file.type.startsWith('video/'));
      if (videoFiles.length + selectedFiles.length > requiredCount) {
        toast.error(`Maximum ${requiredCount} videos allowed`);
        return;
      }
      setSelectedFiles(prev => [...prev, ...videoFiles]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select video files first");
      return;
    }

    setIsUploading(true);
    try {
      // First create or get audit submission
      const { data: submissionData, error: submissionError } = await supabase
        .from("role_audit_submissions")
        .select("id")
        .eq("transition_request_id", transitionRequestId)
        .single();

      let submissionId;
      if (submissionError) {
        const { data: newSubmission, error: createError } = await supabase
          .from("role_audit_submissions")
          .insert({
            transition_request_id: transitionRequestId,
            audit_form_url: '', // Will be updated when form is uploaded
          })
          .select()
          .single();

        if (createError) throw createError;
        submissionId = newSubmission.id;
      } else {
        submissionId = submissionData.id;
      }

      // Upload each video
      for (const file of selectedFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${transitionRequestId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("audit_videos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { error: videoSubmissionError } = await supabase
          .from("role_video_submissions")
          .insert({
            audit_submission_id: submissionId,
            video_url: filePath,
          });

        if (videoSubmissionError) throw videoSubmissionError;
        
        setUploadedCount(prev => prev + 1);
      }

      toast.success("Videos uploaded successfully");
      setSelectedFiles([]);
      setUploadedCount(0);
      onUploadSuccess?.();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload videos");
    } finally {
      setIsUploading(false);
    }
  };

  const remainingCount = requiredCount - uploadedCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Required Videos</CardTitle>
        <CardDescription>
          Upload {remainingCount} more video{remainingCount !== 1 ? 's' : ''} for this role transition request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="video-upload">Video Submission</Label>
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              disabled={isUploading || selectedFiles.length >= requiredCount}
              multiple
            />
          </div>
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected Videos:</p>
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4" />
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
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
                  Upload Videos
                </>
              )}
            </Button>
            <div className="flex items-center gap-2 text-sm">
              {uploadedCount === requiredCount ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
              <span>
                {uploadedCount} of {requiredCount} required videos uploaded
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
