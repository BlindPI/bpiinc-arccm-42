
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus, Users } from "lucide-react";
import { TeamList } from "@/components/teams/TeamList";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";

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
              Manage your organization's teams and their members
            </p>
          </div>
          {canManageTeams && <CreateTeamDialog />}
        </div>

        <div className="grid gap-4">
          <TeamList />
        </div>
      </div>
    </DashboardLayout>
  );
}
