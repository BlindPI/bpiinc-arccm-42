
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/courses';

export function useCourseData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching course data with certification values...');
      
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

      // Log certification values for debugging
      console.log(`Found ${certValues.length} certification values across ${courses.length} courses`);
      
      // Count instructor certification values
      const instructorCertCount = certValues.filter(cert => cert.certification_type === 'INSTRUCTOR').length;
      console.log(`Found ${instructorCertCount} instructor certification values`);

      // Now map the certification values to their respective courses
      return courses.map(course => {
        // Find all certification values for this course
        const courseCerts = certValues.filter(cert => cert.course_id === course.id);
        
        // Create a certification_values object from the filtered records
        const certification_values = courseCerts.reduce((acc, cert) => {
          acc[cert.certification_type] = cert.certification_value;
          return acc;
        }, {} as Record<string, string>);
        
        // Debug logging for instructor courses
        if (certification_values['INSTRUCTOR'] || course.name.toLowerCase().includes('instructor')) {
          console.log('Found instructor course:', {
            id: course.id,
            name: course.name,
            instructorLevel: certification_values['INSTRUCTOR'] || 'No specific level'
          });
        }
        
        // Add the certification_values to the course object
        return {
          ...course,
          certification_values
        };
      }) as Course[];
    },
  });
}
