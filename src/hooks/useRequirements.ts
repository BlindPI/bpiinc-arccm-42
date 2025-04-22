
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRequirements(progressionPathId: string | null) {
  const queryClient = useQueryClient();

  // Fetch requirements for a given progression path
  const { data: requirements, isLoading: loading, error } = useQuery({
    queryKey: ['progression-requirements', progressionPathId],
    queryFn: async () => {
      if (!progressionPathId) return [];
      const { data, error } = await supabase
        .from('progression_requirements')
        .select('*')
        .eq('progression_path_id', progressionPathId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!progressionPathId,
  });

  // Create a new requirement (admin)
  const createRequirement = useMutation({
    mutationFn: async (input: {
      progression_path_id: string;
      requirement_type: string;
      title: string;
      description?: string;
      required_count?: number;
      is_mandatory?: boolean;
      sort_order?: number;
      metadata?: Record<string, any>;
    }) => {
      const { error } = await supabase
        .from('progression_requirements')
        .insert([input]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-requirements', progressionPathId] });
    }
  });

  // Update a requirement (admin)
  const updateRequirement = useMutation({
    mutationFn: async ({
      id, ...updates
    }: {
      id: string;
      [key: string]: any;
    }) => {
      const { error } = await supabase
        .from('progression_requirements')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-requirements', progressionPathId] });
    }
  });

  // Delete a requirement (admin)
  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('progression_requirements')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-requirements', progressionPathId] });
    }
  });


  return {
    requirements,
    loading,
    error,
    createRequirement,
    updateRequirement,
    deleteRequirement,
  };
}
