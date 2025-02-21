
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS, UserRole } from "@/lib/roles";
import { ArrowUpCircle } from "lucide-react";
import { UseMutationResult } from "@tanstack/react-query";

interface RoleTransitionRequestCardProps {
  currentRole: UserRole;
  canRequestUpgrade: (toRole: UserRole) => boolean;
  createTransitionRequest: UseMutationResult<void, Error, UserRole, unknown>;
}

export function RoleTransitionRequestCard({
  currentRole,
  canRequestUpgrade,
  createTransitionRequest
}: RoleTransitionRequestCardProps) {
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
          {Object.keys(ROLE_LABELS).map((role) => (
            canRequestUpgrade(role as UserRole) && (
              <div key={role}>
                <Button
                  onClick={() => createTransitionRequest.mutate(role as UserRole)}
                  className="w-full sm:w-auto"
                >
                  <ArrowUpCircle className="mr-2 h-4 w-4" />
                  Request Upgrade to {ROLE_LABELS[role as UserRole]}
                </Button>
              </div>
            )
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
