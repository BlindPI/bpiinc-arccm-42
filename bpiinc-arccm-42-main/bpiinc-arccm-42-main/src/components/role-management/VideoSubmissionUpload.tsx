
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { VideoUpload } from "./VideoUpload";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Loader2 } from "lucide-react";

interface VideoSubmissionUploadProps {
  transitionRequestId: string;
  requiredCount: number;
  onUploadSuccess: () => void;
}

export const VideoSubmissionUpload = ({ 
  transitionRequestId, 
  requiredCount,
  onUploadSuccess 
}: VideoSubmissionUploadProps) => {
  const { user } = useAuth();
  const [isAddingVideo, setIsAddingVideo] = useState(false);
  
  const { data: videos, isLoading, refetch } = useQuery({
    queryKey: ['role-videos', transitionRequestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_video_submissions')
        .select('*')
        .eq('transition_request_id', transitionRequestId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!transitionRequestId && !!user?.id
  });

  const handleUploadSuccess = async () => {
    await refetch();
    onUploadSuccess();
    setIsAddingVideo(false);
    toast.success('Video uploaded successfully');
  };

  const videosUploaded = videos?.length || 0;
  const uploadProgress = Math.min((videosUploaded / requiredCount) * 100, 100);
  const uploadComplete = videosUploaded >= requiredCount;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Video className="h-5 w-5" />
            Teaching Videos
          </CardTitle>
          <Badge variant={uploadComplete ? "default" : "secondary"}>
            {videosUploaded} of {requiredCount} uploaded
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Upload {requiredCount} videos demonstrating your teaching skills. These videos will be reviewed as part of your role transition request.
        </p>

        {isAddingVideo ? (
          <VideoUpload
            transitionRequestId={transitionRequestId}
            onUploadSuccess={handleUploadSuccess}
            onCancel={() => setIsAddingVideo(false)}
          />
        ) : (
          <div className="mt-4">
            <Button 
              onClick={() => setIsAddingVideo(true)}
              className="w-full"
              disabled={uploadComplete}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Video
            </Button>
          </div>
        )}

        {videos && videos.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium">Uploaded Videos</h3>
            <div className="space-y-3">
              {videos.map((video, index) => (
                <div 
                  key={video.id} 
                  className="p-3 border rounded-md flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{video.title || `Video ${index + 1}`}</p>
                    <p className="text-xs text-muted-foreground">
                      Uploaded: {new Date(video.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={video.status === 'APPROVED' ? 'default' : (video.status === 'REJECTED' ? 'destructive' : 'secondary')}>
                    {video.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
