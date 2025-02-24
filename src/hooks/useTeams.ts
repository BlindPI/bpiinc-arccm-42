
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TeamWithMembers, Team, TeamMember } from "@/types/teams";
import { toast } from "sonner";

export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      try {
        // First fetch only the teams data
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, type, description, created_at, created_by, is_active')
          .order('created_at', { ascending: false });

        if (teamsError) throw teamsError;
        if (!teams) return [] as TeamWithMembers[];

        // Then fetch team members with specific profile fields to avoid recursion
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select(`
            id,
            team_id,
            user_id,
            role,
            status,
            added_at,
            added_by,
            profiles!team_members_user_id_fkey (
              id,
              display_name,
              role
            )
          `)
          .in('team_id', teams.map(team => team.id));

        if (membersError) throw membersError;

        // Transform the data explicitly to match our types
        const teamsWithMembers: TeamWithMembers[] = teams.map((team: Team) => ({
          ...team,
          team_members: (membersData || [])
            .filter(member => member.team_id === team.id)
            .map(member => ({
              id: member.id,
              team_id: member.team_id,
              user_id: member.user_id,
              role: member.role,
              status: member.status,
              added_at: member.added_at,
              added_by: member.added_by,
              profiles: member.profiles
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
