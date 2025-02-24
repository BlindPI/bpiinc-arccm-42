
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamWithMembers } from "@/types/teams";
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
              profiles!team_members_user_id_fkey (
                id,
                display_name,
                role
              )
            )
          `);

        if (error) throw error;
        return teams as TeamWithMembers[];
      } catch (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to fetch teams');
        throw error;
      }
    },
  });
}
