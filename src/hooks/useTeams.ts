
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Team {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'MEMBER' | 'ADMIN';
  created_at: string;
  updated_at: string;
}

export function useTeams() {
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at');

      if (error) {
        console.error('Error fetching teams:', error);
        toast.error('Failed to load teams');
        throw error;
      }

      return data as Team[];
    },
  });

  const addTeam = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string }) => {
      const { data, error } = await supabase
        .from('teams')
        .insert([{ name, parent_id: parentId }])
        .select()
        .single();

      if (error) {
        console.error('Error adding team:', error);
        toast.error('Failed to create team');
        throw error;
      }

      toast.success('Team created successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  return {
    teams,
    isLoading,
    addTeam: addTeam.mutate,
    isAdding: addTeam.isPending,
  };
}
