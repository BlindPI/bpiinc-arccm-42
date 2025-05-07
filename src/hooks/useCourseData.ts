
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/courses';

export function useCourseData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_type:course_type_id(id, name),
          assessment_type:assessment_type_id(id, name)
        `)
        .order('name');
      
      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }
      return data as Course[];
    },
  });
}
