
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserProgress(userId: string | null) {
  const queryClient = useQueryClient();

  // Fetch progress for requirements assigned to this user
  const { data: progress, isLoading: loading, error } = useQuery({
    queryKey: ['user-requirement-progress', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('user_requirement_progress')
        .select('*, requirement:requirement_id(*)')
        .eq('user_id', userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Update progress for a requirement
  const updateProgress = useMutation({
    mutationFn: async ({
      id, ...updates
    }: {
      id: string;
      status?: string;
      progress_data?: Record<string, any>;
      submission_date?: string;
    }) => {
      const { error } = await supabase
        .from('user_requirement_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-requirement-progress', userId] });
    }
  });

  // Mark a requirement as submitted or in progress
  const setStatus = (id: string, status: string) =>
    updateProgress.mutate({ id, status });

  return {
    progress,
    loading,
    error,
    updateProgress,
    setStatus,
  };
}
