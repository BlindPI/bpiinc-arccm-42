
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Settings } from "lucide-react";
import { ManageTeamDialog } from "./ManageTeamDialog";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
            <p className="text-sm font-medium">Leadership</p>
            <p className="text-sm text-muted-foreground">
              {team.leader?.role 
                ? `Team Lead (${team.leader.role})`
                : 'No team lead assigned'}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Team Members ({team.members.length})</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {team.members.map((member, index) => (
                <Badge key={index} variant="outline">
                  {member.member?.role || "Role pending"}
                </Badge>
              ))}
            </div>
          </div>

          {!canManageTeam && team.members.length === 0 && (
            <Alert>
              <AlertDescription>
                This team currently has no members. Contact an administrator to request membership.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
