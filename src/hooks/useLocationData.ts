
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Location } from '@/types/supabase-schema';

export function useLocationData(filters?: { search?: string; city?: string; status?: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['locations', filters],
    queryFn: async () => {
      console.log('Fetching locations with filters:', filters);
      
      try {
        let query = supabase
          .from('locations')
          .select('*');
        
        // Apply filters if provided
        if (filters?.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters?.city) {
          query = query.eq('city', filters.city);
        }
        
        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%`);
        }
        
        // Always sort by name
        query = query.order('name');
        
        const { data: locations, error } = await query;
        
        if (error) {
          console.error('Error fetching locations:', error);
          throw error;
        }

        console.log(`Successfully fetched ${locations?.length || 0} locations`);
        return locations as Location[];
      } catch (error) {
        console.error('Unexpected error in location data fetch:', error);
        throw error;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Get unique cities from locations data
  const cities = data ? [...new Set(data.filter(location => location.city).map(location => location.city))] : [];

  return {
    locations: data || [],
    cities,
    isLoading,
    error
  };
}
