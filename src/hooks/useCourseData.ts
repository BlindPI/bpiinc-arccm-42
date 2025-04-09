
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/types/supabase-schema';

export function useCourseData() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Course[];
    },
  });
}
