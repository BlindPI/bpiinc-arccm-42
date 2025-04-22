
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProgressionPaths() {
  const queryClient = useQueryClient();

  // Fetch all progression paths (publicly readable)
  const { data: paths, isLoading: loadingPaths, error: pathsError } = useQuery({
    queryKey: ['progression-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progression_paths')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Create a new progression path (admin)
  const createPath = useMutation({
    mutationFn: async (input: {
      from_role: string;
      to_role: string;
      title: string;
      description?: string;
    }) => {
      const { data, error } = await supabase
        .from('progression_paths')
        .insert([input])
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-paths'] });
    }
  });

  // Update an existing progression path (admin)
  const updatePath = useMutation({
    mutationFn: async ({
      id, ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
    }) => {
      const { error } = await supabase
        .from('progression_paths')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-paths'] });
    }
  });

  // Delete a progression path (admin)
  const deletePath = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('progression_paths')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progression-paths'] });
    }
  });

  return {
    paths,
    loadingPaths,
    pathsError,
    createPath,
    updatePath,
    deletePath,
  };
}
