
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Location } from '@/types/supabase-schema';

export function useLocationData() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform database records to application types with proper field mapping
      return (data || []).map(location => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        postal_code: location.zip || location.postal_code || '', // Handle both field names
        country: location.country,
        email: location.email,
        phone: location.phone,
        website: location.website,
        logo_url: location.logo_url,
        status: location.status as 'ACTIVE' | 'INACTIVE',
        created_at: location.created_at,
        updated_at: location.updated_at
      }));
    }
  });
}
