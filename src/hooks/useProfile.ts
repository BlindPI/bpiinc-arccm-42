
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        console.warn('useProfile: No user ID provided');
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('useProfile: Error fetching profile:', error);
        throw error;
      }

      console.log('useProfile: Successfully fetched profile:', profile);
      return profile;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}
