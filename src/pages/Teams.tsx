
import { DashboardLayout } from "@/components/DashboardLayout";
import { TeamGrid } from "@/components/teams/TeamGrid";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function TeamsPage() {
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
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        </div>
        <TeamGrid />
      </div>
    </DashboardLayout>
  );
}
