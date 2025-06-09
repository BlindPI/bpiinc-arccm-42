
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { getNextRole } from "@/utils/roleUtils";
import { useProfile } from "@/hooks/useProfile";
import { useRequirements } from "@/hooks/useRequirements";
import { useProgressionPaths } from "@/hooks/useProgressionPaths";
import { useUserProgress } from "@/hooks/useUserProgress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import * as React from "react";

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
  // Get current user profile (for id)
  const { data: profile } = useProfile();

  // Figure out the next role
  const nextRole = getNextRole(currentRole);

  // Find the matching progression path for this transition
  const { paths: progressionPaths, loadingPaths } = useProgressionPaths();
  const progressionPath = React.useMemo(() => {
    return progressionPaths?.find(
      (p: any) => p.from_role === currentRole && p.to_role === nextRole
    );
  }, [progressionPaths, currentRole, nextRole]);

  // Load requirements for path
  const { requirements, loadingRequirements } = useRequirements(progressionPath?.id);

  // Load user progress for each requirement
  const { progress, loadingProgress } = useUserProgress(profile?.id, progressionPath?.id);

  // Show loader if anything necessary is loading
  if (loadingPaths || loadingRequirements || loadingProgress) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Clock className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // No advancement path exists: don't show "request" at all
  if (!progressionPath || !nextRole || !canRequestUpgrade(nextRole)) {
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

  // Calculate eligibility: all mandatory requirements are approved
  const mandatoryRequirements = requirements?.filter((r: any) => r.is_mandatory) || [];
  const completedMandatoryCount = mandatoryRequirements.filter((r: any) => {
    const progressItem = progress?.find((p: any) => p.requirement_id === r.id);
    return progressItem?.status === 'approved';
  }).length;
  const isEligible = mandatoryRequirements.length > 0 && completedMandatoryCount === mandatoryRequirements.length;

  // Requirement progress rendering
  const requirementsSummary: { [type: string]: { label: string; total: number; done: number } } = {};
  requirements?.forEach((req: any) => {
    const progressItem = progress?.find((p: any) => p.requirement_id === req.id);
    const status = progressItem?.status || 'not_started';
    // Type-categorize: one bar per type, counts toward "done" if approved
    if (!requirementsSummary[req.requirement_type]) {
      requirementsSummary[req.requirement_type] = {
        label:
          req.requirement_type === "document"
            ? "Documents"
            : req.requirement_type === "hours"
            ? "Teaching Hours"
            : req.requirement_type === "assessment"
            ? "Assessment"
            : req.requirement_type === "certificate"
            ? "Certificates"
            : req.requirement_type.charAt(0).toUpperCase() + req.requirement_type.slice(1),
        total: 0,
        done: 0,
      };
    }
    requirementsSummary[req.requirement_type].total += req.required_count || 1;
    // "Done" if approved or numeric progress equals/exceeds required_count
    // Here, approval for the requirement is enough to count as done
    if (status === 'approved') {
      requirementsSummary[req.requirement_type].done += req.required_count || 1;
    }
  });

  // Flatten into rendering order for most common types
  const typeOrder = ["hours", "document", "assessment", "certificate"];
  const summaryList = [
    ...typeOrder
      .filter((type) => requirementsSummary[type])
      .map((type) => ({ ...requirementsSummary[type], requirement_type: type })),
    ...Object.entries(requirementsSummary)
      .filter(([type]) => !typeOrder.includes(type))
      .map(([type, val]) => ({ ...val, requirement_type: type })),
  ];

  // Helper for generic fallback if none detected
  const fallbackProgress = (label: string, total: number, done: number) => (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span>
          <span className={done >= total ? "text-green-500 font-bold" : ""}>
            {done}
          </span> / {total}
        </span>
      </div>
      <Progress value={total ? (done / total) * 100 : 0} />
    </div>
  );

  return (
    <Card className="border-2 border-blue-400/30 bg-blue-50/40 animate-fade-in shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpCircle className="h-6 w-6 text-primary" />
          Next Role:{" "}
          <span className="text-blue-500">{ROLE_LABELS[nextRole]}</span>
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
          {summaryList.length === 0 && (
            <span className="block text-center text-muted-foreground py-4">
              No requirements configured for this path.
            </span>
          )}
          {/* Render each unique requirement type as a progress bar */}
          {summaryList.map((req) =>
            fallbackProgress(req.label, req.total, req.done)
          )}
        </div>
        <Separator />
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Required Items</span>
            <span>
              <span className={isEligible ? "text-green-500 font-bold" : ""}>
                {completedMandatoryCount}
              </span> / {mandatoryRequirements.length}
            </span>
          </div>
          <Progress
            value={
              mandatoryRequirements.length
                ? (completedMandatoryCount / mandatoryRequirements.length) * 100
                : 0
            }
          />
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
