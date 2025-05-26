
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/supabase-schema";
import { toast } from "sonner";

export function useProfile() {
  const { user, loading: authLoading, authReady } = useAuth();
  
  console.log("🔍 DEBUG: useProfile hook called",
    "User:", user?.id || "none",
    "Auth loading:", authLoading,
    "Auth ready:", authReady);

  const result = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      console.log('🔍 DEBUG: useProfile: Starting profile fetch for user:', user?.id,
        "Timestamp:", new Date().toISOString());
      
      if (!user?.id) {
        console.warn('🔍 DEBUG: useProfile: No user ID provided, auth loading:', authLoading);
        return null;
      }

      try {
        console.log('🔍 DEBUG: useProfile: Fetching from profiles table for user:', user.id);
        const startTime = performance.now();
        
        // Just try to fetch the existing profile
        // With the trigger, profiles are created automatically on signup
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
          
        const duration = performance.now() - startTime;

        if (error) {
          console.error('🔍 DEBUG: useProfile: Error fetching profile:', error.message, error.code);
          throw error;
        }

        if (!profile) {
          console.log('🔍 DEBUG: useProfile: No profile found for user:', user.id,
            "Duration:", Math.round(duration) + "ms");
          return null;
        }

        console.log('🔍 DEBUG: useProfile: Successfully fetched profile:',
          "User:", user.id,
          "Role:", profile.role,
          "Duration:", Math.round(duration) + "ms");
        return profile as Profile;
      } catch (error) {
        console.error('🔍 DEBUG: useProfile: Unexpected error:', error);
        toast.error('Error accessing user profile. Please try again or contact support.');
        throw error;
      }
    },
    enabled: !!user?.id && authReady && !authLoading,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep unused data in cache for 10 minutes
    retry: 2, // Only retry twice
    retryDelay: (attemptIndex) => Math.min(1000 * Math.pow(2, attemptIndex), 30000), // Exponential backoff
  });

  // Add the mutate function to the result
  return {
    ...result,
    mutate: () => {
      // This will trigger a refetch of the profile data
      return result.refetch();
    }
  } as UseQueryResult<Profile, Error> & { mutate: () => Promise<any> };
}
