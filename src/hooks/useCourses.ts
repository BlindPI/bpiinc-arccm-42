import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Course {
  id: string;
  title: string;
  description?: string;
  course_type_id?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useCourses() {
  return useQuery({
    queryKey: ['courses-simple'],
    queryFn: async () => {
      console.log('Fetching courses for selection...');
      
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          course_type_id,
          status,
          created_at,
          updated_at
        `)
        .eq('status', 'ACTIVE')
        .order('title');
      
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