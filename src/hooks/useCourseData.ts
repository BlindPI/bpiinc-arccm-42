
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/courses';

export function useCourseData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      // First, get all courses with their basic relationships
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
        throw error;
      }

      // Get all course certification values in a separate query
      const { data: certValues, error: certError } = await supabase
        .from('course_certification_values')
        .select('*');

      if (certError) {
        console.error('Error fetching certification values:', certError);
        throw certError;
      }

      // Now map the certification values to their respective courses
      return courses.map(course => {
        // Find all certification values for this course
        const courseCerts = certValues.filter(cert => cert.course_id === course.id);
        
        // Create a certification_values object from the filtered records
        const certification_values = courseCerts.reduce((acc, cert) => {
          acc[cert.certification_type] = cert.certification_value;
          return acc;
        }, {} as Record<string, string>);
        
        // Add the certification_values to the course object
        return {
          ...course,
          certification_values
        };
      }) as Course[];
    },
  });
}
