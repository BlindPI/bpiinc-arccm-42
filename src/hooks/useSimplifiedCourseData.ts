
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Course } from '@/types/courses';

export function useSimplifiedCourseData() {
  return useQuery({
    queryKey: ['simplified-courses'],
    queryFn: async () => {
      console.log('Fetching simplified course data...');
      
      try {
        // Get all courses with their essential relationships
        const { data: courses, error } = await supabase
          .from('courses')
          .select(`
            *,
            course_type:course_type_id(id, name),
            assessment_type:assessment_type_id(id, name)
          `)
          .order('name');
        
        if (error) {
          console.error('Error fetching courses:', error);
          toast.error('Failed to load courses');
          throw error;
        }

        console.log(`Successfully fetched ${courses.length} courses`);
        return courses as Course[];
      } catch (error) {
        console.error('Unexpected error in course data query:', error);
        toast.error('Failed to load courses. Please try again.');
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
