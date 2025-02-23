
import { DashboardLayout } from "@/components/DashboardLayout";
import { UserPlus, Users } from "lucide-react";
import { TeamList } from "@/components/teams/TeamList";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { useProfile } from "@/hooks/useProfile";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Teams() {
  const { data: currentUserProfile } = useProfile();

  const canManageTeams = currentUserProfile?.role && ['SA', 'AD'].includes(currentUserProfile.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
            <p className="text-muted-foreground">
              {canManageTeams 
                ? "Create and manage teams, assign members, and organize your organization's structure"
                : "View team information and member assignments"}
            </p>
          </div>
          {canManageTeams && <CreateTeamDialog />}
        </div>

        {!canManageTeams && (
          <Alert>
            <AlertDescription>
              Only System Administrators and Admins can manage teams. You have view-only access to team information.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <TeamList />
        </div>
      </div>
    </DashboardLayout>
  );
}
