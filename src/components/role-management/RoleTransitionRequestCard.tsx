
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { getNextRole } from "@/utils/roleUtils";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
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

  // Query for role requirements
  const { data: progressData, isLoading: requirementsLoading } = useQuery({
    queryKey: ['role-requirements', currentRole, nextRole],
    queryFn: async () => {
      if (!nextRole) return null;

      const { data, error } = await supabase
        .from('supervision_progress')
        .select('*')
        .eq('supervisee_role', currentRole)
        .single();

      if (error) throw error;

      // Transform the data to match RoleRequirements interface
      const requirements: RoleRequirements = {
        teaching_hours: data.required_teaching_hours || 0,
        completed_teaching_hours: data.completed_teaching_hours || 0,
        min_sessions: data.total_evaluations || 0,
        completed_sessions: data.completed_evaluations || 0,
        required_documents: data.required_documents || 0,
        submitted_documents: data.submitted_documents || 0,
        required_videos: data.required_videos || 0,
        submitted_videos: data.submitted_videos || 0,
        time_in_role_days: data.days_in_current_role || 0,
        min_time_in_role_days: 30, // Default value, adjust as needed
        supervisor_evaluations_required: data.total_evaluations || 0,
        supervisor_evaluations_completed: data.completed_evaluations || 0,
        meets_teaching_requirement: data.meets_teaching_requirement || false,
        meets_evaluation_requirement: data.meets_evaluation_requirement || false,
        meets_time_requirement: data.meets_time_requirement || false,
        document_compliance: data.document_compliance || false
      };

      return requirements;
    },
    enabled: !!nextRole
  });

  // Don't render the card if there's no next role or user can't request upgrade
  if (!nextRole || !canRequestUpgrade(nextRole)) {
    return null;
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
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Role Advancement Progress</CardTitle>
        <CardDescription>
          Track your progress towards {ROLE_LABELS[nextRole]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teaching Requirements */}
        <div className="space-y-4">
          <h3 className="font-semibold">Teaching Requirements</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Required Teaching Hours</span>
              <span>
                {progressData?.completed_teaching_hours || 0} / {progressData?.teaching_hours || 0} hours
              </span>
            </div>
            <Progress 
              value={((progressData?.completed_teaching_hours || 0) / (progressData?.teaching_hours || 1)) * 100}
            />
            <div className="flex justify-between text-sm">
              <span>Completed Sessions</span>
              <span>
                {progressData?.completed_sessions || 0} / {progressData?.min_sessions || 0} sessions
              </span>
            </div>
            <Progress 
              value={((progressData?.completed_sessions || 0) / (progressData?.min_sessions || 1)) * 100}
            />
          </div>
        </div>

        <Separator />

        {/* Documentation Requirements */}
        <div className="space-y-4">
          <h3 className="font-semibold">Documentation Requirements</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Required Documents</span>
              <span>
                {progressData?.submitted_documents || 0} / {progressData?.required_documents || 0}
              </span>
            </div>
            <Progress 
              value={((progressData?.submitted_documents || 0) / (progressData?.required_documents || 1)) * 100}
            />
          </div>
        </div>

        {/* Video Submissions if required */}
        {progressData?.required_videos > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Video Submissions</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Videos</span>
                  <span>
                    {progressData?.submitted_videos || 0} / {progressData?.required_videos || 0}
                  </span>
                </div>
                <Progress 
                  value={((progressData?.submitted_videos || 0) / (progressData?.required_videos || 1)) * 100}
                />
              </div>
            </div>
          </>
        )}

        {/* Supervisor Evaluations */}
        {progressData?.supervisor_evaluations_required > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Supervisor Evaluations</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Evaluations</span>
                  <span>
                    {progressData?.supervisor_evaluations_completed || 0} / {progressData?.supervisor_evaluations_required || 0}
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

        {/* Time in Role */}
        <Separator />
        <div className="space-y-4">
          <h3 className="font-semibold">Time in Current Role</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Days in Role</span>
              <span>
                {progressData?.time_in_role_days || 0} / {progressData?.min_time_in_role_days || 0} days
              </span>
            </div>
            <Progress 
              value={((progressData?.time_in_role_days || 0) / 
                     (progressData?.min_time_in_role_days || 1)) * 100}
            />
          </div>
        </div>

        {/* Upgrade Request Section */}
        <div className="pt-4">
          {!isEligible ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete all requirements before requesting an upgrade to {ROLE_LABELS[nextRole]}
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={() => createTransitionRequest.mutate(nextRole)}
              className="w-full sm:w-auto"
              disabled={!isEligible}
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Request Upgrade to {ROLE_LABELS[nextRole]}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
