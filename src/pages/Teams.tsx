
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamGrid } from "@/components/teams/TeamGrid";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { useProfile } from "@/hooks/useProfile";

export default function TeamsPage() {
  const { data: profile } = useProfile();
  const isAdmin = profile?.role === 'SA' || profile?.role === 'AD';

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and team members
            </p>
          </div>
          {isAdmin && <CreateTeamDialog />}
        </div>
        <TeamGrid />
      </div>
    </DashboardLayout>
  );
}
