
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CourseOffering } from "@/types/courses";

export function useCourseOfferings(courseId?: string) {
  return useQuery({
    queryKey: ['courseOfferings', courseId],
    queryFn: async () => {
      const query = supabase
        .from('course_offerings')
        .select(`
          *,
          courses (*),
          locations (*),
          profiles:instructor_id (*)
        `)
        .order('start_date');

      if (courseId) {
        query.eq('course_id', courseId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as (CourseOffering & {
        courses: Course;
        locations: Location;
        profiles: Profile;
      })[];
    },
    enabled: courseId !== undefined,
  });
}
