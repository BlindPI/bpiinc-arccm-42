
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { TeamWithMembers } from "@/types/teams";
import { ROLE_LABELS } from "@/lib/roles";

interface TeamCardProps {
  team: TeamWithMembers;
  onClick?: () => void;
}

export function TeamCard({ team, onClick }: TeamCardProps) {
  const memberCount = team.team_members?.length || 0;
  const adminMembers = team.team_members?.filter(member => member.role === 'ADMIN') || [];

  return (
    <Card 
      onClick={onClick}
      className="cursor-pointer hover:shadow-md transition-shadow"
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{team.type}</Badge>
          <Users className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardTitle className="mt-2">{team.name}</CardTitle>
        <CardDescription>{team.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          <div className="flex gap-2">
            {adminMembers.map((member) => (
              <span key={member.id} className="font-medium">
                {member.profiles?.display_name || 'Unknown'}
                <span className="text-xs ml-1">
                  ({ROLE_LABELS[member.profiles?.role || 'IT']})
                </span>
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
