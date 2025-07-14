
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/courses';

export function useCourseData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching course data with certification values...');
      
      try {
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

        console.log(`Successfully fetched ${courses?.length || 0} courses`);
        
        if (!courses || courses.length === 0) {
          console.warn('No courses returned from database');
          return [];
        }

        // Get all course certification values in a separate query
        const { data: certValues, error: certError } = await supabase
          .from('course_certification_values')
          .select('*');

        if (certError) {
          console.error('Error fetching certification values:', certError);
          // Don't throw error for cert values, just continue without them
          console.warn('Continuing without certification values');
        }

        // Log certification values for debugging
        const validCertValues = certValues || [];
        console.log(`Found ${validCertValues.length} certification values across ${courses.length} courses`);
        
        // Count instructor certification values
        const instructorCertCount = validCertValues.filter(cert => cert.certification_type === 'INSTRUCTOR').length;
        console.log(`Found ${instructorCertCount} instructor certification values`);

        // Now map the certification values to their respective courses
        return courses.map(course => {
          // Find all certification values for this course
          const courseCerts = validCertValues.filter(cert => cert.course_id === course.id);
          
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
      } catch (error) {
        console.error('Unexpected error in course data fetch:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
