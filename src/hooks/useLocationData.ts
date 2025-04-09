
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Location, LocationInsert } from '@/types/courses';
import { toast } from 'sonner';

export function useLocationData(filters?: {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  city?: string;
}) {
  const queryClient = useQueryClient();

  const locationsQuery = useQuery({
    queryKey: ['locations', filters],
    queryFn: async () => {
      let query = supabase
        .from('locations')
        .select('*');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'ACTIVE');
      }
      
      if (filters?.city) {
        query = query.eq('city', filters.city);
      }
      
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
      }
      
      query = query.order('name');
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Location[];
    },
  });
  
  const locationCitiesQuery = useQuery({
    queryKey: ['location-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('city')
        .eq('status', 'ACTIVE')
        .not('city', 'is', null);
      
      if (error) throw error;
      
      // Extract unique cities and filter out nulls
      const cities = [...new Set(data.map(item => item.city).filter(Boolean))];
      return cities as string[];
    },
  });

  const createLocation = useMutation({
    mutationFn: async (newLocation: LocationInsert) => {
      // If latitude/longitude not provided but we have an address, geocode it
      let locationWithCoordinates = { ...newLocation };
      
      const { data, error } = await supabase
        .from('locations')
        .insert([locationWithCoordinates])
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-cities'] });
      toast.success('Location created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create location: ${error.message}`);
    }
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Location> & { id: string }) => {
      // If updating address and latitude/longitude not provided, geocode it
      let updatesWithCoordinates = { ...updates };
      
      const { data, error } = await supabase
        .from('locations')
        .update(updatesWithCoordinates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Location;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location-cities'] });
      toast.success('Location updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update location: ${error.message}`);
    }
  });

  return {
    data: locationsQuery.data || [],
    cities: locationCitiesQuery.data || [],
    isLoading: locationsQuery.isLoading,
    error: locationsQuery.error,
    createLocation,
    updateLocation
  };
}
