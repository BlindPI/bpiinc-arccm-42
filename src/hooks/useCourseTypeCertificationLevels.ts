
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  
  return {
    relationships,
    isLoading
  };
}
