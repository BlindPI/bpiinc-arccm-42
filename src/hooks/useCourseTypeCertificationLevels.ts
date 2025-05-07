
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CourseTypeCertificationLevelInput } from '@/types/certification-levels';

export function useCourseTypeCertificationLevels(courseTypeId?: string) {
  const queryClient = useQueryClient();
  
  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['course-type-certification-levels', courseTypeId],
    queryFn: async () => {
      let query = supabase
        .from('course_type_certification_levels')
        .select('*, certification_level:certification_level_id(id, name, type)');
      
      if (courseTypeId) {
        query = query.eq('course_type_id', courseTypeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching course type certification levels:', error);
        toast.error('Failed to load certification level associations');
        throw error;
      }
      
      return data;
    },
    enabled: Boolean(courseTypeId)
  });

  const associateCertificationLevel = useMutation({
    mutationFn: async (input: CourseTypeCertificationLevelInput) => {
      const { data, error } = await supabase
        .from('course_type_certification_levels')
        .insert([input])
        .select();
      
      if (error) {
        console.error('Error associating certification level:', error);
        toast.error('Failed to associate certification level with course type');
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-type-certification-levels'] });
      toast.success('Certification level associated successfully');
    }
  });

  const removeCertificationLevelAssociation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_type_certification_levels')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error removing certification level association:', error);
        toast.error('Failed to remove certification level association');
        throw error;
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-type-certification-levels'] });
      toast.success('Certification level association removed successfully');
    }
  });

  return {
    relationships,
    isLoading,
    associateCertificationLevel,
    removeCertificationLevelAssociation
  };
}
