
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AssessmentType, AssessmentTypeInsert } from '@/types/courses';

export function useAssessmentTypes() {
  const queryClient = useQueryClient();
  
  const { data: assessmentTypes = [], isLoading } = useQuery({
    queryKey: ['assessment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessment_types')
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching assessment types:', error);
        toast.error('Failed to load assessment types');
        throw error;
      }
      
      return data as AssessmentType[];
    }
  });

  const createAssessmentType = useMutation({
    mutationFn: async (newType: AssessmentTypeInsert) => {
      const { data, error } = await supabase
        .from('assessment_types')
        .insert([newType])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating assessment type:', error);
        if (error.code === '23505') {
          toast.error('An assessment type with this name already exists');
        } else {
          toast.error('Failed to create assessment type');
        }
        throw error;
      }
      
      return data as AssessmentType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
      toast.success('Assessment type created successfully');
    }
  });

  const updateAssessmentType = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AssessmentType> & { id: string }) => {
      const { data, error } = await supabase
        .from('assessment_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating assessment type:', error);
        if (error.code === '23505') {
          toast.error('An assessment type with this name already exists');
        } else {
          toast.error('Failed to update assessment type');
        }
        throw error;
      }
      
      return data as AssessmentType;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
      toast.success('Assessment type updated successfully');
    }
  });

  const toggleAssessmentTypeStatus = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      const { data, error } = await supabase
        .from('assessment_types')
        .update({ active })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error toggling assessment type status:', error);
        toast.error('Failed to update assessment type status');
        throw error;
      }
      
      return data as AssessmentType;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['assessment-types'] });
      toast.success(`Assessment type ${data.active ? 'activated' : 'deactivated'} successfully`);
    }
  });

  return {
    assessmentTypes,
    isLoading,
    createAssessmentType,
    updateAssessmentType,
    toggleAssessmentTypeStatus,
  };
}
