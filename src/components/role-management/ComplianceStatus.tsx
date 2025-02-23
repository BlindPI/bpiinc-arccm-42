
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileCheck, Video, GraduationCap } from 'lucide-react';

interface ComplianceSummary {
  required_documents: number;
  approved_documents: number;
  required_videos: number;
  submitted_videos: number;
  teaching_hours: number;
  completed_sessions: number;
  document_completion_percentage: number;
  video_completion_percentage: number;
}

interface ComplianceStatusProps {
  userId: string;
}

export function ComplianceStatus({ userId }: ComplianceStatusProps) {
  const { data: compliance, isLoading } = useQuery({
    queryKey: ['compliance-summary', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_compliance_summary')
        .select('*')
        .eq('instructor_id', userId)
        .single();
      
      if (error) throw error;
      return data as ComplianceSummary;
    }
  });

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
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <span>Document Compliance</span>
            </div>
            <span className="text-sm">
              {compliance?.approved_documents} of {compliance?.required_documents} Complete
            </span>
          </div>
          <Progress value={compliance?.document_completion_percentage || 0} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              <span>Video Submissions</span>
            </div>
            <span className="text-sm">
              {compliance?.submitted_videos} of {compliance?.required_videos} Complete
            </span>
          </div>
          <Progress value={compliance?.video_completion_percentage || 0} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary" />
              <span>Teaching Progress</span>
            </div>
            <span className="text-sm">
              {compliance?.completed_sessions} Sessions ({compliance?.teaching_hours} Hours)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
