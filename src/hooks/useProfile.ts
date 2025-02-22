
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/user-management";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('useProfile: Starting profile fetch for user:', user?.id);
      
      if (!user?.id) {
        console.warn('useProfile: No user ID provided');
        throw new Error('No user ID provided');
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('useProfile: Supabase error:', error);
          throw error;
        }

        if (!profile) {
          console.warn('useProfile: No profile found for user:', user.id);
          // Instead of returning null, throw an error to trigger error boundary
          throw new Error('Profile not found');
        }

        console.log('useProfile: Successfully fetched profile:', profile);
        return profile as Profile;
      } catch (error) {
        console.error('useProfile: Caught error:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: (failureCount, error) => {
      // Only retry if it's not a "Profile not found" error
      if (error instanceof Error && error.message === 'Profile not found') {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });
}
