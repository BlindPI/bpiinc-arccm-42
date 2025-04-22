
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { getNextRole } from "@/utils/roleUtils";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RoleRequirements } from "@/types/user-management";

interface RoleTransitionRequestProps {
  currentRole: UserRole;
  canRequestUpgrade: (toRole: UserRole) => boolean;
  createTransitionRequest: UseMutationResult<void, Error, UserRole, unknown>;
}

export function RoleTransitionRequestCard({
  currentRole,
  canRequestUpgrade,
  createTransitionRequest
}: RoleTransitionRequestProps) {
  const nextRole = getNextRole(currentRole);

  const { data: progressData, isLoading: requirementsLoading } = useQuery({
    queryKey: ['role-requirements', currentRole, nextRole],
    queryFn: async () => {
      if (!nextRole) return null;
      // In production pull from roles API - here use mock
      const mockData: RoleRequirements = {
        id: 'mock-id',
        from_role: currentRole,
        to_role: nextRole,
        teaching_hours: 20,
        completed_teaching_hours: 10,
        min_sessions: 5,
        completed_sessions: 2,
        required_documents: 3,
        submitted_documents: 1,
        required_videos: 1,
        submitted_videos: 0,
        time_in_role_days: 15,
        min_time_in_role_days: 30,
        meets_teaching_requirement: false,
        meets_evaluation_requirement: false,
        meets_time_requirement: false,
        document_compliance: false,
        supervisor_evaluations_required: 2,
        supervisor_evaluations_completed: 1
      };
      return mockData;
    },
    enabled: !!nextRole
  });

  if (!nextRole || !canRequestUpgrade(nextRole)) {
    return (
      <Card className="border border-muted-foreground/15 bg-muted animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <ArrowUpCircle className="h-5 w-5" />
            Role Advancement Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              There are no eligible upgrades available from your current role.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (requirementsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Clock className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const isEligible = progressData?.meets_teaching_requirement &&
                     progressData?.meets_evaluation_requirement &&
                     progressData?.meets_time_requirement &&
                     progressData?.document_compliance;

  return (
    <Card className="border-2 border-blue-400/30 bg-blue-50/40 animate-fade-in shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          Next Role: <span className="text-blue-500">{ROLE_LABELS[nextRole]}</span>
          {isEligible ? (
            <CheckCircle2 className="ml-1 h-5 w-5 text-green-500 animate-pulse" />
          ) : (
            <Clock className="ml-1 h-5 w-5 text-amber-500" />
          )}
        </CardTitle>
        <CardDescription>
          Review your progress and requirements for advancement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Teaching Requirements</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Teaching Hours</span>
              <span>
                <span className={progressData?.completed_teaching_hours >= progressData?.teaching_hours ? "text-green-500 font-bold" : ""}>
                  {progressData?.completed_teaching_hours || 0}
                </span> / {progressData?.teaching_hours || 0} hours
              </span>
            </div>
            <Progress 
              value={((progressData?.completed_teaching_hours || 0) / (progressData?.teaching_hours || 1)) * 100}
            />
            <div className="flex justify-between text-sm">
              <span>Sessions Completed</span>
              <span>
                <span className={progressData?.completed_sessions >= progressData?.min_sessions ? "text-green-500 font-bold" : ""}>
                  {progressData?.completed_sessions || 0}
                </span> / {progressData?.min_sessions || 0}
              </span>
            </div>
            <Progress 
              value={((progressData?.completed_sessions || 0) / (progressData?.min_sessions || 1)) * 100}
            />
          </div>
        </div>
        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold">Documentation</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Documents</span>
              <span>
                <span className={progressData?.submitted_documents >= progressData?.required_documents ? "text-green-500 font-bold" : ""}>
                  {progressData?.submitted_documents || 0}
                </span> / {progressData?.required_documents || 0}
              </span>
            </div>
            <Progress 
              value={((progressData?.submitted_documents || 0) / (progressData?.required_documents || 1)) * 100}
            />
          </div>
        </div>

        {progressData?.required_videos > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Video Submissions</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Videos</span>
                  <span>
                    <span className={progressData?.submitted_videos >= progressData?.required_videos ? "text-green-500 font-bold" : ""}>
                      {progressData?.submitted_videos || 0}
                    </span> / {progressData?.required_videos || 0}
                  </span>
                </div>
                <Progress 
                  value={((progressData?.submitted_videos || 0) / (progressData?.required_videos || 1)) * 100}
                />
              </div>
            </div>
          </>
        )}

        {progressData?.supervisor_evaluations_required > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Supervisor Evaluations</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Evaluations</span>
                  <span>
                    <span className={progressData?.supervisor_evaluations_completed >= progressData?.supervisor_evaluations_required ? "text-green-500 font-bold" : ""}>
                      {progressData?.supervisor_evaluations_completed || 0}
                    </span> / {progressData?.supervisor_evaluations_required || 0}
                  </span>
                </div>
                <Progress 
                  value={((progressData?.supervisor_evaluations_completed || 0) / 
                         (progressData?.supervisor_evaluations_required || 1)) * 100}
                />
              </div>
            </div>
          </>
        )}

        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold">Time in Role</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Days in Role</span>
              <span>
                <span className={progressData?.time_in_role_days >= progressData?.min_time_in_role_days ? "text-green-500 font-bold" : ""}>
                  {progressData?.time_in_role_days || 0}
                </span> / {progressData?.min_time_in_role_days || 0}
              </span>
            </div>
            <Progress 
              value={((progressData?.time_in_role_days || 0) / 
                     (progressData?.min_time_in_role_days || 1)) * 100}
            />
          </div>
        </div>
        <div className="pt-2">
          {!isEligible ? (
            <Alert className="border-l-4 border-amber-400 bg-amber-50/80">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription>
                Please complete all requirements to unlock the upgrade request.
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={() => createTransitionRequest.mutate(nextRole)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold shadow hover:scale-105 transition-transform"
              disabled={!isEligible}
            >
              <ArrowUpCircle className="mr-2 h-5 w-5" />
              Request Upgrade to {ROLE_LABELS[nextRole]}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
