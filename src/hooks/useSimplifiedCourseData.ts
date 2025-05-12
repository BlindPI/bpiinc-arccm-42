
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
            assessment_type:assessment_type_id(id, name),
            prerequisites:course_prerequisites(
              id,
              prerequisite_course:prerequisite_course_id(id, name),
              is_required
            )
          `)
          .order('name');
        
        if (error) {
          console.error('Error fetching courses:', error);
          toast.error('Failed to load courses');
          throw error;
        }

        console.log(`Successfully fetched ${courses.length} courses`);
        
        // Ensure prerequisites is always an array
        const coursesWithArrayPrerequisites = courses.map(course => ({
          ...course,
          prerequisites: course.prerequisites || []
        }));
        
        return coursesWithArrayPrerequisites as Course[];
      } catch (error) {
        console.error('Unexpected error in course data query:', error);
        toast.error('Failed to load courses. Please try again.');
        throw error;
      }
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
