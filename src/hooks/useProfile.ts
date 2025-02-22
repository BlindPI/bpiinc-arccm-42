
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/user-management";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.log('useProfile: No user ID available, skipping fetch');
        return null;
      }

      console.log('useProfile: Starting profile fetch for user:', user.id);
      
      try {
        // Add timeout to prevent hanging in preview
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 5000);
        });

        const fetchPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        // Race between fetch and timeout
        const { data: profile, error } = await Promise.race([
          fetchPromise,
          timeoutPromise,
        ]) as typeof fetchPromise;

        if (error) {
          console.error('useProfile: Supabase error:', error);
          throw error;
        }

        if (!profile) {
          console.log('useProfile: No profile found for user:', user.id);
          return null;
        }

        console.log('useProfile: Successfully fetched profile:', profile);
        return profile as Profile;
      } catch (error) {
        console.error('useProfile: Fetch error:', error);
        // Return null instead of throwing to prevent error boundary triggering
        return null;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1 second before retrying
  });
}
