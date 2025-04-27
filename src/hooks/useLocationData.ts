
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/supabase-schema';

export function useLocationData() {
  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('status', 'ACTIVE')
        .order('name');
      
      if (error) throw error;
      return data as Location[];
    },
  });

  return {
    locations,
    isLoading,
    error
  };
}
