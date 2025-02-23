
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";
import { TeamCard } from "./TeamCard";
import { useProfile } from "@/hooks/useProfile";
import { Team } from "./types";

export function TeamList() {
  const { data: currentUserProfile } = useProfile();
  const { data: teams, isLoading } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_groups')
        .select(`
          *,
          leader:profiles!team_groups_leader_id_fkey(id, role),
          members:team_members(
            member:profiles!team_members_member_id_fkey(id, role)
          )
        `);

      if (error) {
        console.error('Error fetching teams:', error);
        throw error;
      }

      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!teams?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            No Teams
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {currentUserProfile?.role && ['SA', 'AD'].includes(currentUserProfile.role)
              ? "No teams have been created yet. Create a team to get started."
              : "You are not a member of any teams yet."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
