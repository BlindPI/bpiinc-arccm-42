
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Fetching profile for user:', user?.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle();
      
      if (error) {
        console.error('useProfile: Error fetching profile:', error);
        throw error;
      }
      console.log('useProfile: Profile data:', data);
      return data;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 1000 * 60 * 5 // Cache for 5 minutes
  });
}
