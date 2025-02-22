
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/user-management";

export function useUserProfiles(isTestDataEnabled?: boolean, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['profiles', isTestDataEnabled],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, role_transition_requests!role_transition_requests_user_id_fkey(*)')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching profiles:', error);
        throw error;
      }

      return data || [];
    },
    ...options,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}
