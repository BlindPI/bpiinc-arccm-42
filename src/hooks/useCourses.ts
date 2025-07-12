import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/types/courses';

export function useCourses() {
  return useQuery({
    queryKey: ['courses-simple'],
    queryFn: async () => {
      console.log('Fetching courses for selection...');
      
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          id,
          name,
          description,
          expiration_months,
          status,
          created_at,
          created_by,
          updated_at,
          course_type_id,
          assessment_type_id,
          first_aid_level,
          cpr_level,
          length
        `)
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) {
        console.error('Error fetching courses:', error);
        throw error;
      }

      console.log(`Found ${courses?.length || 0} active courses`);
      return courses as Course[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}