
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Check, X, Clock } from "lucide-react";
import { CompletionSummary, CertificationRequirement } from "@/types/supabase-views";

export const TeachingProgress = ({ userId }: { userId: string }) => {
  const { data: completionData, isLoading: completionLoading } = useQuery({
    queryKey: ['course-completion', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_completion_summary')
        .select('*')
        .eq('instructor_id', userId);

      if (error) throw error;
      return data as CompletionSummary[];
    }
  });

  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['certification-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('certification_requirements')
        .select('*');

      if (error) throw error;
      return data as CertificationRequirement[];
    }
  });

  if (completionLoading || requirementsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const getCompletionStatus = (
    summary: CompletionSummary,
    requirement: CertificationRequirement
  ) => {
    if (!summary.total_sessions) return "NOT_STARTED";
    if (
      summary.completed_sessions >= requirement.min_sessions &&
      (summary.total_hours || 0) >= requirement.required_hours
    ) {
      return "COMPLETED";
    }
    return "IN_PROGRESS";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Check className="h-4 w-4 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teaching Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {completionData?.map((summary) => {
          const requirement = requirements?.find(r => r.course_id === summary.course_id);
          if (!requirement) return null;

          const status = getCompletionStatus(summary, requirement);
          const hoursProgress = ((summary.total_hours || 0) / requirement.required_hours) * 100;
          const sessionsProgress = ((summary.completed_sessions || 0) / requirement.min_sessions) * 100;

          return (
            <div key={summary.course_id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{summary.course_name}</h3>
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <span className={`text-sm ${
                    status === "COMPLETED" ? "text-green-600" :
                    status === "IN_PROGRESS" ? "text-amber-600" : "text-red-600"
                  }`}>
                    {status.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Teaching Hours</span>
                  <span className="font-medium">
                    {summary.total_hours || 0} / {requirement.required_hours} hours
                  </span>
                </div>
                <Progress value={Math.min(hoursProgress, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Completed Sessions</span>
                  <span className="font-medium">
                    {summary.completed_sessions || 0} / {requirement.min_sessions} sessions
                  </span>
                </div>
                <Progress value={Math.min(sessionsProgress, 100)} className="h-2" />
              </div>

              {summary.last_session_date && (
                <div className="text-sm text-muted-foreground">
                  Last session: {new Date(summary.last_session_date).toLocaleDateString()}
                </div>
              )}
            </div>
          );
        })}

        {(!completionData || completionData.length === 0) && (
          <div className="text-center text-muted-foreground">
            No teaching progress data available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
