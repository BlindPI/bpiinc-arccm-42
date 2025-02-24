
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamWithMembers } from "@/types/teams";
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

        // Then fetch team members for these teams
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select(`
            *,
            profiles:user_id (
              id,
              display_name,
              role
            )
          `)
          .in('team_id', teams.map(team => team.id));

        if (membersError) throw membersError;

        // Manually combine the data to avoid recursive relationships
        const teamsWithMembers = teams.map(team => ({
          ...team,
          team_members: members.filter(member => member.team_id === team.id)
        }));

        return teamsWithMembers as TeamWithMembers[];
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to fetch teams');
        throw error;
      }
    },
  });
}
