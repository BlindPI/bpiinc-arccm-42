
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamWithMembers, Team, TeamMember } from "@/types/teams";
import { toast } from "sonner";

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        // First fetch teams
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });

        if (teamsError) throw teamsError;

        if (!teams) return [] as TeamWithMembers[];

        // Then fetch team members and their profiles in one go
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles:profiles!team_members_user_id_fkey (
              id,
              display_name,
              role
            )
          `)
          .in('team_id', teams.map(team => team.id));

        if (membersError) throw membersError;

        // Transform the data to match our expected types
        const teamsWithMembers: TeamWithMembers[] = teams.map((team: Team) => ({
          ...team,
          team_members: (members || [])
            .filter(member => member.team_id === team.id)
            .map(member => ({
              ...member,
              profiles: member.profiles // This ensures the profiles property matches our TeamMember type
            }))
        }));

        return teamsWithMembers;
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to fetch teams');
        throw error;
      }
    },
  });
}
