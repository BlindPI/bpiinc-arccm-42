
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useUserProgress(userId?: string, progressionPathId?: string) {
  const queryClient = useQueryClient();

  // Fetch progress for the user on a specific progression path
  const { 
    data: progress, 
    isLoading: loadingProgress, 
    error: progressError 
  } = useQuery({
    queryKey: ['user-progress', userId, progressionPathId],
    queryFn: async () => {
      if (!userId || !progressionPathId) return [];
      
      // First, get all requirements for this path
      const { data: requirements, error: reqError } = await supabase
        .from('progression_requirements')
        .select('id')
        .eq('progression_path_id', progressionPathId);
      
      if (reqError) {
        console.error('Error fetching requirements:', reqError);
        throw reqError;
      }
      
      if (!requirements || requirements.length === 0) {
        return [];
      }
      
      // Then get all progress entries for these requirements
      const requirementIds = requirements.map(r => r.id);
      
      const { data, error } = await supabase
        .from('user_requirement_progress')
        .select('*')
        .eq('user_id', userId)
        .in('requirement_id', requirementIds);
      
      if (error) {
        console.error('Error fetching user progress:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!userId && !!progressionPathId,
  });

  // Update progress on a requirement
  const updateProgress = useMutation({
    mutationFn: async (input: {
      requirementId: string;
      status: 'not_started' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
      progressData?: Record<string, any>;
    }) => {
      if (!userId) throw new Error('User ID is required');
      
      const { requirementId, status, progressData } = input;
      
      // Check if there's an existing progress entry
      const { data: existing, error: existingError } = await supabase
        .from('user_requirement_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('requirement_id', requirementId)
        .maybeSingle();
      
      if (existingError) {
        console.error('Error checking existing progress:', existingError);
        throw existingError;
      }
      
      let result;
      
      if (existing) {
        // Update existing entry
        const updates: any = { 
          status, 
          updated_at: new Date().toISOString() 
        };
        
        if (progressData) {
          updates.progress_data = progressData;
        }
        
        if (status === 'submitted') {
          updates.submission_date = new Date().toISOString();
        }
        
        const { data, error } = await supabase
          .from('user_requirement_progress')
          .update(updates)
          .eq('id', existing.id)
          .select();
        
        if (error) {
          console.error('Error updating progress:', error);
          throw error;
        }
        
        result = data;
      } else {
        // Create new entry
        const newEntry: any = {
          user_id: userId,
          requirement_id: requirementId,
          status,
        };
        
        if (progressData) {
          newEntry.progress_data = progressData;
        }
        
        if (status === 'submitted') {
          newEntry.submission_date = new Date().toISOString();
        }
        
        const { data, error } = await supabase
          .from('user_requirement_progress')
          .insert([newEntry])
          .select();
        
        if (error) {
          console.error('Error creating progress:', error);
          throw error;
        }
        
        result = data;
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['user-progress', userId, progressionPathId] 
      });
    }
  });

  // Submit a requirement for review
  const submitForReview = useMutation({
    mutationFn: async (input: {
      requirementId: string;
      progressData: Record<string, any>;
    }) => {
      return updateProgress.mutateAsync({
        requirementId: input.requirementId,
        status: 'submitted',
        progressData: input.progressData
      });
    }
  });

  return {
    progress,
    loadingProgress,
    progressError,
    updateProgress,
    submitForReview,
  };
}
