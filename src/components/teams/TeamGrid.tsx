
import { useTeams } from "@/hooks/useTeams";
import { Loader2 } from "lucide-react";
import { TeamCard } from "./TeamCard";

export function TeamGrid() {
  const { data: teams, isLoading } = useTeams();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!teams?.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No teams found. Create a new team to get started.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
