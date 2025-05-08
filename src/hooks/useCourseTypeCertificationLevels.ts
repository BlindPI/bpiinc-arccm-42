
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CourseTypeCertificationLevel {
  id: string;
  course_type_id: string;
  certification_level_id: string;
  created_at: string;
  certification_level?: {
    id: string;
    name: string;
    type: string;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
}

export function useCourseTypeCertificationLevels(courseTypeId?: string) {
  const queryClient = useQueryClient();
  
  const { data: relationships = [], isLoading } = useQuery({
    queryKey: ['course-type-certification-levels', courseTypeId],
    queryFn: async () => {
      if (!courseTypeId) return [];
      
      const { data, error } = await supabase
        .from('course_type_certification_levels')
        .select(`
          *,
          certification_level:certification_level_id(*)
        `)
        .eq('course_type_id', courseTypeId);
        
      if (error) {
        console.error('Error fetching course type certification levels:', error);
        throw error;
      }
      
      return data as CourseTypeCertificationLevel[];
    },
    enabled: !!courseTypeId,
  });
  
  // Add mutation for associating certification levels with course types
  const associateCertificationLevel = useMutation({
    mutationFn: async ({ 
      course_type_id, 
      certification_level_id 
    }: { 
      course_type_id: string; 
      certification_level_id: string 
    }) => {
      const { data, error } = await supabase
        .from('course_type_certification_levels')
        .insert([
          { course_type_id, certification_level_id }
        ])
        .select()
        .single();
        
      if (error) {
        console.error('Error associating certification level:', error);
        throw error;
      }
      
      return data as CourseTypeCertificationLevel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-type-certification-levels'] });
      toast.success('Certification level associated successfully');
    },
    onError: (error) => {
      console.error('Error in associating certification level:', error);
      toast.error('Failed to associate certification level');
    }
  });
  
  // Add mutation for removing associations
  const removeCertificationLevelAssociation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('course_type_certification_levels')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error removing certification level association:', error);
        throw error;
      }
      
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-type-certification-levels'] });
      toast.success('Certification level association removed');
    },
    onError: (error) => {
      console.error('Error in removing certification level association:', error);
      toast.error('Failed to remove certification level association');
    }
  });
  
  return {
    relationships,
    isLoading,
    associateCertificationLevel,
    removeCertificationLevelAssociation
  };
}
