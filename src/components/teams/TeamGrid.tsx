
import { useTeams } from "@/hooks/useTeams";
import { TeamCard } from "./TeamCard";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamGrid() {
  const { data: teams, isLoading } = useTeams();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  if (!teams?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No teams found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard 
          key={team.id} 
          team={team}
        />
      ))}
    </div>
  );
}
