
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, Settings } from "lucide-react";
import { ManageTeamDialog } from "./ManageTeamDialog";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";

interface TeamCardProps {
  team: {
    id: string;
    name: string;
    group_type: string;
    leader: { role: string } | null;
    members: { member: { role: string } | null }[];
  };
}

export function TeamCard({ team }: TeamCardProps) {
  const { data: currentUserProfile } = useProfile();
  const canManageTeam = currentUserProfile?.role && ['SA', 'AD'].includes(currentUserProfile.role);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {team.name}
          </CardTitle>
          {canManageTeam && <ManageTeamDialog team={team} />}
        </div>
        <Badge variant="secondary">{team.group_type}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium">Leader Role</p>
            <p className="text-sm text-muted-foreground">{team.leader?.role || 'No leader assigned'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Members ({team.members.length})</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.members.map((member, index) => (
                <Badge key={index} variant="outline">
                  {member.member?.role}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
