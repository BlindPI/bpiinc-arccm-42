
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle, AlertCircle } from "lucide-react";
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

export function RoleTransitionRequestCard({
  currentRole,
  canRequestUpgrade,
  createTransitionRequest
}: RoleTransitionRequestProps) {
  const nextRole = getNextRole(currentRole);

  // Query for teaching requirements
  const { data: requirements } = useQuery({
    queryKey: ['teaching-requirements', currentRole, nextRole],
    queryFn: async () => {
      if (!nextRole) return null;
      const { data, error } = await supabase
        .from('certification_requirements')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!nextRole
  });

  // Query for compliance status
  const { data: compliance } = useQuery({
    queryKey: ['instructor-compliance', currentRole],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructor_compliance_summary')
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Don't render the card if there's no next role or user can't request upgrade
  if (!nextRole || !canRequestUpgrade(nextRole)) {
    return null;
  }

  const isCompliant = compliance?.document_completion_percentage === 100 && 
                     (compliance?.video_completion_percentage ?? 0) >= 100;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle>Role Advancement Progress</CardTitle>
        <CardDescription>
          Track your progress towards {ROLE_LABELS[nextRole]}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Teaching Progress Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">Teaching Requirements</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completed Sessions</span>
              <span className="font-medium">
                {compliance?.completed_sessions || 0} / {requirements?.min_sessions || 0}
              </span>
            </div>
            <Progress 
              value={((compliance?.completed_sessions || 0) / (requirements?.min_sessions || 1)) * 100} 
            />
          </div>
        </div>

        <Separator />

        {/* Document Requirements Section */}
        <div className="space-y-4">
          <h3 className="font-semibold">Documentation Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Required Documents</span>
              <span className="font-medium">
                {compliance?.approved_documents || 0} / {compliance?.required_documents || 0}
              </span>
            </div>
            <Progress value={compliance?.document_completion_percentage || 0} />
          </div>
        </div>

        {/* Upgrade Request Section */}
        <div className="pt-4">
          {!isCompliant ? (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Complete all requirements before requesting an upgrade to {ROLE_LABELS[nextRole]}
              </AlertDescription>
            </Alert>
          ) : (
            <Button
              onClick={() => createTransitionRequest.mutate(nextRole)}
              className="w-full sm:w-auto"
              disabled={!isCompliant}
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
