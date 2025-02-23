
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TeamMember, TeamMemberResponse } from "../types";
import { toast } from "sonner";

export function useTeamMembers(teamId: string, enabled: boolean) {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery<TeamMemberResponse[], Error>({
    queryKey: ['team-members', teamId],
    queryFn: async () => {
      console.log('Fetching team members for team:', teamId);
      const { data: teamMembers, error } = await supabase
        .from('team_members')
        .select(`
          id,
          member_id,
          profiles:member_id (
            id,
            role
          )
        `)
        .eq('team_id', teamId);

      if (error) {
        console.error('Error fetching team members:', error);
        throw error;
      }

      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

      if (usersError) {
        console.error('Error fetching user emails:', usersError);
        throw usersError;
      }

      const typedTeamMembers = teamMembers as TeamMemberResponse[];
      const typedUsers = users.users as { id: string; email?: string; }[];

      const membersWithEmail = typedTeamMembers.map(member => ({
        ...member,
        email: typedUsers.find(user => user.id === member.member_id)?.email || 'Unknown'
      }));

      console.log('Team members fetched:', membersWithEmail);
      return membersWithEmail;
    },
    enabled,
  });

  const addMember = useMutation({
    mutationFn: async (email: string) => {
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (userError) throw userError;

      const typedUsers = users.users as { id: string; email?: string; }[];
      const user = typedUsers.find(u => u.email === email);
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          member_id: user.id
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Team member added successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add team member');
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('member_id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] });
      toast.success('Team member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove team member');
    },
  });

  return {
    members,
    isLoading,
    addMember,
    removeMember
  };
}
