
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const TeachingProgress = ({ userId }: { userId: string }) => {
  const { data: teachingData, isLoading } = useQuery({
    queryKey: ['teaching-progress', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_compliance')
        .select('*')
        .eq('instructor_id', userId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const progress = teachingData ? 
    Math.min((teachingData.completed_teaching_hours / teachingData.required_teaching_hours) * 100, 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Teaching Hours</span>
            <span className="font-medium">
              {teachingData?.completed_teaching_hours || 0} / {teachingData?.required_teaching_hours || 0} hours
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="text-sm text-muted-foreground">
          {progress >= 100 ? 
            "Required teaching hours completed!" : 
            `${Math.round(teachingData?.required_teaching_hours - teachingData?.completed_teaching_hours)} hours remaining`
          }
        </div>
      </CardContent>
    </Card>
  );
};
