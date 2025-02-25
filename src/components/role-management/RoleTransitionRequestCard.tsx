
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

interface RoleTransitionRequestProps {
  currentRole: UserRole;
  canRequestUpgrade: (toRole: UserRole) => boolean;
  createTransitionRequest: UseMutationResult<void, Error, UserRole, unknown>;
}

interface RoleRequirements {
  teaching_hours: number;
  completed_hours: number;
  min_sessions: number;
  completed_sessions: number;
  required_documents: number;
  submitted_documents: number;
  required_videos: number;
  submitted_videos: number;
  time_in_role_days: number;
  min_time_in_role_days: number;
  supervisor_evaluations_required: number;
  supervisor_evaluations_completed: number;
}

export function RoleTransitionRequestCard({
  currentRole,
  canRequestUpgrade,
  createTransitionRequest
}: RoleTransitionRequestProps) {
  const nextRole = getNextRole(currentRole);

  // Query for role requirements
  const { data: requirements, isLoading: requirementsLoading } = useQuery({
    queryKey: ['role-requirements', currentRole, nextRole],
    queryFn: async () => {
      if (!nextRole) return null;

      const { data, error } = await supabase
        .from('supervision_progress')
        .select('*')
        .eq('supervisee_role', currentRole)
        .single();

      if (error) throw error;
      return data as RoleRequirements;
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

  const isEligible = requirements?.meets_teaching_requirement &&
                     requirements?.meets_evaluation_requirement &&
                     requirements?.meets_time_requirement &&
                     requirements?.document_compliance;

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
                {requirements?.completed_hours || 0} / {requirements?.teaching_hours || 0} hours
              </span>
            </div>
            <Progress 
              value={((requirements?.completed_hours || 0) / (requirements?.teaching_hours || 1)) * 100}
            />
            <div className="flex justify-between text-sm">
              <span>Completed Sessions</span>
              <span>
                {requirements?.completed_sessions || 0} / {requirements?.min_sessions || 0} sessions
              </span>
            </div>
            <Progress 
              value={((requirements?.completed_sessions || 0) / (requirements?.min_sessions || 1)) * 100}
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
                {requirements?.submitted_documents || 0} / {requirements?.required_documents || 0}
              </span>
            </div>
            <Progress 
              value={((requirements?.submitted_documents || 0) / (requirements?.required_documents || 1)) * 100}
            />
          </div>
        </div>

        {/* Video Submissions if required */}
        {requirements?.required_videos > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Video Submissions</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Videos</span>
                  <span>
                    {requirements?.submitted_videos || 0} / {requirements?.required_videos || 0}
                  </span>
                </div>
                <Progress 
                  value={((requirements?.submitted_videos || 0) / (requirements?.required_videos || 1)) * 100}
                />
              </div>
            </div>
          </>
        )}

        {/* Supervisor Evaluations */}
        {requirements?.supervisor_evaluations_required > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Supervisor Evaluations</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Required Evaluations</span>
                  <span>
                    {requirements?.supervisor_evaluations_completed || 0} / {requirements?.supervisor_evaluations_required || 0}
                  </span>
                </div>
                <Progress 
                  value={((requirements?.supervisor_evaluations_completed || 0) / 
                         (requirements?.supervisor_evaluations_required || 1)) * 100}
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
                {requirements?.time_in_role_days || 0} / {requirements?.min_time_in_role_days || 0} days
              </span>
            </div>
            <Progress 
              value={((requirements?.time_in_role_days || 0) / 
                     (requirements?.min_time_in_role_days || 1)) * 100}
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
