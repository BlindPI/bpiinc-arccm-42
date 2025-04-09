
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseOffering } from '@/types/courses';

export function useCourseOfferings() {
  return useQuery({
    queryKey: ['course_offerings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_offerings')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data as CourseOffering[];
    },
  });
}
