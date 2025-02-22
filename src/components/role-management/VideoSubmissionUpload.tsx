
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { VideoUpload } from './VideoUpload';

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
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Video Submissions</CardTitle>
        <CardDescription>
          Please upload {requiredCount} videos demonstrating the required skills
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: requiredCount }).map((_, index) => (
            <VideoUpload
              key={index}
              transitionRequestId={transitionRequestId}
              videoIndex={index}
              onUploadSuccess={onUploadSuccess}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

