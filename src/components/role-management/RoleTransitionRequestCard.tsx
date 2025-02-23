
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";
import { getNextRole } from "@/utils/roleUtils";

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

  // Don't render the card if there's no next role or user can't request upgrade
  if (!nextRole || !canRequestUpgrade(nextRole)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role Transition</CardTitle>
        <CardDescription>
          Request a role upgrade when you're ready to advance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Button
              onClick={() => createTransitionRequest.mutate(nextRole)}
              className="w-full sm:w-auto"
            >
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              Request Upgrade to {ROLE_LABELS[nextRole]}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
