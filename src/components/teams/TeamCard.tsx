
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageTeamDialog } from "./ManageTeamDialog";
import { Team } from "./types";
import { Users } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const { data: currentUserProfile } = useProfile();
  const canManageTeam = currentUserProfile?.role && ['SA', 'AD'].includes(currentUserProfile.role);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
          <Users className="h-5 w-5" />
          {team.name}
        </CardTitle>
        {canManageTeam && <ManageTeamDialog team={team} />}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Type</p>
            <p className="text-sm">{team.group_type.replace('_', ' ')}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Members</p>
            <p className="text-sm">{team.members?.length || 0} members</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
