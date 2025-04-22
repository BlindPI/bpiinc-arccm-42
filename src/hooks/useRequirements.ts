
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRequirements(progressionPathId?: string) {
  const queryClient = useQueryClient();

  // Fetch requirements for a specific progression path
  const { 
    data: requirements, 
    isLoading: loadingRequirements, 
    error: requirementsError 
  } = useQuery({
    queryKey: ['progression-requirements', progressionPathId],
    queryFn: async () => {
      if (!progressionPathId) return [];
      
      const { data, error } = await supabase
        .from('progression_requirements')
        .select('*')
        .eq('progression_path_id', progressionPathId)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching requirements:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!progressionPathId,
  });

  // Create a new requirement
  const createRequirement = useMutation({
    mutationFn: async (input: {
      progression_path_id: string;
      requirement_type: string;
      title: string;
      description?: string;
      is_mandatory?: boolean;
      required_count?: number;
      sort_order?: number;
      metadata?: Record<string, any>;
    }) => {
      console.log('Creating requirement with data:', input);
      
      const { data, error } = await supabase
        .from('progression_requirements')
        .insert([input])
        .select();
      
      if (error) {
        console.error('Error creating requirement:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['progression-requirements', progressionPathId] 
      });
    }
  });

  // Update an existing requirement
  const updateRequirement = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      is_mandatory?: boolean;
      required_count?: number;
      sort_order?: number;
      requirement_type?: string;
      metadata?: Record<string, any>;
    }) => {
      console.log('Updating requirement:', id, updates);
      
      const { error } = await supabase
        .from('progression_requirements')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating requirement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['progression-requirements', progressionPathId] 
      });
    }
  });

  // Delete a requirement
  const deleteRequirement = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting requirement:', id);
      
      const { error } = await supabase
        .from('progression_requirements')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting requirement:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['progression-requirements', progressionPathId] 
      });
    }
  });

  // Update multiple requirements sorting order
  const updateRequirementsOrder = useMutation({
    mutationFn: async (orderedRequirements: { id: string, sort_order: number }[]) => {
      console.log('Updating requirements order:', orderedRequirements);
      
      // Create an array of promises for each update
      const promises = orderedRequirements.map(req => {
        return supabase
          .from('progression_requirements')
          .update({ sort_order: req.sort_order })
          .eq('id', req.id);
      });
      
      // Wait for all updates to complete
      const results = await Promise.all(promises);
      
      // Check for errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error('Errors updating requirements order:', errors);
        throw errors[0].error;
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['progression-requirements', progressionPathId] 
      });
    }
  });

  return {
    requirements,
    loadingRequirements,
    requirementsError,
    createRequirement,
    updateRequirement,
    deleteRequirement,
    updateRequirementsOrder,
  };
}
