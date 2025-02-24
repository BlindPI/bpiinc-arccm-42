
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Team, TeamMember } from "@/types/teams";
import { toast } from "sonner";

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        const { data: teams, error } = await supabase
          .from('teams')
          .select(`
            *,
            team_members (
              *,
              profiles (
                id,
                display_name,
                role
              )
            )
          `);

        if (error) throw error;
        return teams as Team[];
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to fetch teams');
        throw error;
      }
    },
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      try {
        const { data: members, error } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles (
              id,
              display_name,
              role
            )
          `)
          .eq('team_id', teamId);

        if (error) throw error;
        return members as TeamMember[];
      } catch (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to fetch team members');
        throw error;
      }
    },
    enabled: !!teamId,
  });
}
